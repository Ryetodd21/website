/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node check uses CommonJS. */
// Run from website/: node scripts/regression-check.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, globals = {}, names) {
  let source = fs.readFileSync(file, "utf8");
  if (names) {
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    source = tree.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name.text))
      .map(node => node.getText(tree)).join("\n");
    source += `\nObject.assign(exports, {${names.join(",")}});`;
  }
  const context = { exports: {}, console, URL, AbortController, AbortSignal, DOMException, ...globals };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}

function client(fetch, relay = "") {
  const sockets = [], timers = new Map(), events = [];
  const storage = new Map([["user_profile_v1", "previous-user"], ["monitor-ung-theme", "dark"]]);
  const window = {
    location: { origin: "https://example.invalid", href: "/reports", replace(url) { this.href = url; } },
    localStorage: { removeItem: key => storage.delete(key) },
    dispatchEvent: event => events.push(event),
  };
  class Socket {
    constructor(url) { this.url = url; sockets.push(this); }
    close() { this.closed = true; }
  }
  const api = load("src/lib/api.ts", {
    process: { env: { NEXT_PUBLIC_API_URL: "https://example.invalid", NEXT_PUBLIC_WS_RELAY_URL: relay } },
    window, fetch, WebSocket: Socket,
    StorageEvent: class { constructor(type, fields) { Object.assign(this, { type }, fields); } },
    setTimeout: callback => { const id = Symbol(); timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return { api, window, sockets, timers, events, storage };
}

const response = (status, body = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const flush = () => new Promise(resolve => setImmediate(resolve));
async function retrySocket(client) {
  const [id, retry] = [...client.timers][0]; client.timers.delete(id);
  await retry();
  return retry;
}

async function main() {
  for (const status of [429, 500, 503]) {
    const c = client(async url => response(url.endsWith("/refresh") ? status : 401));
    await assert.rejects(c.api.apiFetch("/api/students"), error => error.name !== "RedirectError");
    assert.equal(c.window.location.href, "/reports");
  }
  const invalid = client(async () => response(401));
  await assert.rejects(invalid.api.apiFetch("/api/students"), { name: "RedirectError" });
  assert.equal(invalid.window.location.href, "https://example.invalid/login");
  const publicPage = client(async () => response(401));
  await assert.rejects(publicPage.api.apiFetch("/api/models/history", { noRedirect: true }), { name: "RedirectError" });
  assert.equal(publicPage.window.location.href, "/reports", "Public pages must not navigate when refresh expires");

  let refreshes = 0;
  const shared = client(async (url, options) => {
    if (url.endsWith("/refresh")) { refreshes++; return response(200, { access_token: "synthetic-token" }); }
    return response(options.headers?.Authorization ? 200 : 401, { value: 1 });
  });
  await Promise.all([shared.api.apiFetch("/a"), shared.api.apiFetch("/b")]);
  assert.equal(refreshes, 1);

  const failedLogout = client(async () => response(503));
  await assert.rejects(failedLogout.api.logout());
  assert.equal(failedLogout.storage.get("user_profile_v1"), "previous-user");
  const loggedOut = client(async () => response(200));
  await loggedOut.api.logout();
  assert.equal(loggedOut.storage.has("user_profile_v1"), false);
  assert.equal(loggedOut.storage.get("monitor-ung-theme"), "dark");
  assert.equal(loggedOut.events.length, 1);

  const c = client(async () => response(200, { role: "admin" }),
    "wss://different-host.invalid/api/logs/stream/ws");
  const messages = [];
  const stop = c.api.subscribeLogsStreamWebSocket(message => messages.push(message));
  await flush();
  assert.equal(c.sockets[0].url, "wss://example.invalid/api/logs/stream/ws");
  c.sockets[0].onopen();
  assert.equal(messages.at(-1).event, "connected");
  await c.sockets[0].onclose({ code: 1006 });
  assert.equal(messages.at(-1).event, "disconnected");
  const retry = await retrySocket(c);
  assert.equal(c.sockets.length, 2);
  c.sockets[1].onopen();
  await c.sockets[1].onclose({ code: 1008 });
  assert.equal(c.timers.size, 1);
  stop();
  assert.equal(c.timers.size, 0);
  await retry();
  assert.equal(c.sockets.length, 2);

  let sessionValid = false, socketRefreshes = 0;
  const expiring = client(async url => {
    if (url.endsWith('/refresh')) {
      socketRefreshes++; sessionValid = true;
      return response(200, { access_token: 'synthetic-token' });
    }
    return response(sessionValid ? 200 : 401, { role: 'dosen' });
  });
  const stopExpiring = expiring.api.subscribeLogsStreamWebSocket(() => {});
  await flush();
  assert.equal(socketRefreshes, 1, 'Refresh before opening a socket with an expired access cookie');
  assert.equal(expiring.sockets.length, 1);
  expiring.sockets[0].onopen(); sessionValid = false;
  expiring.sockets[0].onclose({ code: 1006 });
  await retrySocket(expiring);
  assert.equal(socketRefreshes, 2, 'A failed handshake must revalidate HTTP auth even when the browser reports 1006');
  assert.equal(expiring.sockets.length, 2);
  stopExpiring();

  for (const result of [response(401), response(200, { role: 'mahasiswa' })]) {
    const denied = client(async () => result);
    const stopDenied = denied.api.subscribeLogsStreamWebSocket(() => {});
    await flush();
    assert.equal(denied.sockets.length, 0, 'No stream without a current staff session');
    assert.equal(denied.timers.size, 0, 'Rejected sessions must not reconnect repeatedly');
    assert.equal(denied.window.location.href, '/reports');
    stopDenied();
  }

  let available = false;
  const outage = client(async () => response(available ? 200 : 503, { role: 'admin' }));
  const stopOutage = outage.api.subscribeLogsStreamWebSocket(() => {});
  await flush();
  assert.equal(outage.sockets.length, 0);
  assert.equal(outage.timers.size, 1, 'Temporary auth service outages retain backoff');
  available = true; await retrySocket(outage);
  assert.equal(outage.sockets.length, 1);
  stopOutage();

  let finishCheck, checkSignal;
  const leaving = client((url, options) => {
    checkSignal = options.signal;
    return new Promise(resolve => { finishCheck = resolve; });
  });
  const stopLeaving = leaving.api.subscribeLogsStreamWebSocket(() => {});
  stopLeaving();
  assert.equal(checkSignal.aborted, true);
  finishCheck(response(200, { role: 'admin' })); await flush();
  assert.equal(leaving.sockets.length, 0, 'Late auth responses cannot reopen an unmounted stream');

  const brokenRoute = client(async () => response(200, { role: 'admin' }));
  const stopBrokenRoute = brokenRoute.api.subscribeLogsStreamWebSocket(() => {});
  await flush();
  for (let attempt = 0; attempt < 10; attempt++) {
    brokenRoute.sockets.at(-1).onclose({ code: 1006 });
    await retrySocket(brokenRoute);
  }
  brokenRoute.sockets.at(-1).onclose({ code: 1006 });
  assert.equal(brokenRoute.timers.size, 0, 'Broken routes stop after ten retries');
  stopBrokenRoute();

  const { escapeCsvCell } = load("src/components/ui/download-button.tsx", {}, ["escapeCsvCell"]);
  for (const value of ["=1+1", "+1+1", "-1+1", "@SUM(A1)", "\t=1+1", "\r=1+1"]) {
    assert.match(escapeCsvCell(value), /^"?'/);
  }
  assert.equal(escapeCsvCell(-5), "-5");
  assert.equal(escapeCsvCell('A,"B"'), '"A,""B"""');

  const { witaWeekRange } = load("src/lib/report-dates.ts");
  for (const [now, start, end] of [
    ["2026-11-15T12:00:00+08:00", "2026-11-09", "2026-11-15"],
    ["2026-11-16T01:00:00+08:00", "2026-11-16", "2026-11-22"],
    ["2027-01-01T01:00:00+08:00", "2026-12-28", "2027-01-03"],
  ]) {
    const actual = witaWeekRange(new Date(now));
    assert.equal(actual.start, start); assert.equal(actual.end, end);
  }
  console.log("PASS refresh/retry, logout/cache, WebSocket session preflight/1006 refresh/denial/backoff/unmount, CSV safety, WITA week boundaries");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
