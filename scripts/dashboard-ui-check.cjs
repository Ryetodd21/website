/* eslint-disable @typescript-eslint/no-require-imports -- Standalone check, no test framework. */
// Run from website/: node scripts/dashboard-ui-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
function hooks() {
  const slots = [], effects = [];
  let cursor = 0;
  const api = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      return slots[i] ?? (slots[i] = { current: initial });
    },
    useCallback(callback) { return callback; },
    useEffect(effect, deps) {
      const i = cursor++;
      const prior = slots[i];
      if (!prior || deps.some((value, index) => value !== prior.deps[index])) {
        effects.push(() => { prior?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; });
      }
    },
  };
  return { api, render(fn) { cursor = 0; const tree = fn(); effects.splice(0).forEach(effect => effect()); return tree; }, unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
const components = new Proxy({}, { get: (_, key) => key === '__esModule' ? true : String(key) });
function load(file, overrides = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const sandbox = { exports: {}, console, Error, AbortController, setTimeout, clearTimeout, ...globals, require(name) {
    if (name in overrides) return overrides[name];
    if (name === 'next/dynamic') return { __esModule: true, default: () => 'Chart' };
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'remark-gfm') return { __esModule: true, default: () => {} };
    if (name === 'sonner') return { toast: { success() {}, error() {} } };
    if (name.startsWith('@/components/') || name === 'recharts') return components;
    if (name === '@/lib/palette') return { palette: {}, clusterPalette: [] };
    return require(name);
  } };
  vm.runInNewContext(output, sandbox, { filename: file });
  return sandbox.exports;
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate), ...nodes(tree.props?.right, predicate)];
}
const find = (tree, predicate) => { const result = nodes(tree, predicate)[0]; assert.ok(result, 'Expected UI element'); return result; };
const text = tree => typeof tree === 'string' || typeof tree === 'number' ? String(tree) : Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : '';

async function main() {
  const metricHooks = hooks(), frames = new Map();
  let frameId = 0, reducedMotion = false;
  const { AnimatedMetricValue } = load('src/components/ui/animated-metric-value.tsx', {
    react: metricHooks.api, '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' ') },
  }, {
    performance: { now: () => 0 },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const metric = (value, durationMs = 600) => metricHooks.render(() => AnimatedMetricValue({ value, durationMs }));
  const tick = time => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); };
  assert.equal(text(metric(10)).trim(), '10');
  metric(20); tick(600);
  assert.equal(text(metric(20)).trim(), '20');
  assert.equal(text(metric('Belum tersedia')).trim(), 'Belum tersedia');
  metric(30, 0); tick(0);
  assert.equal(text(metric(30, 0)).trim(), '30', 'Zero duration finishes without NaN');
  reducedMotion = true; metric(40); tick(0);
  assert.equal(text(metric(40)).trim(), '40', 'Reduced motion finishes in one frame');
  reducedMotion = false; metric(50); assert.equal(frames.size, 1);
  metricHooks.unmount(); assert.equal(frames.size, 0, 'Unmount cancels animation');
  const emptyMetricHooks = hooks();
  const EmptyMetric = load('src/components/ui/animated-metric-value.tsx', { react: emptyMetricHooks.api, '@/lib/utils': { cn: () => '' } }).AnimatedMetricValue;
  emptyMetricHooks.render(() => EmptyMetric({ value: 'Belum tersedia' }));
  assert.equal(text(emptyMetricHooks.render(() => EmptyMetric({ value: 12 }))).trim(), '12', 'First numeric value after placeholder remains readable');
  emptyMetricHooks.unmount();

  const modelHooks = hooks(), pointRequests = [];
  let modelId = 'first-model';
  const Models = load('src/app/(dashboard)/models/page.tsx', {
    react: modelHooks.api,
    '@/components/ui/sortable-header': { SortableHeader: 'SortableHeader', useSort: () => ({ sorted: rows => rows }) },
    '@/lib/limits': { CLUSTER_POINTS_LIMIT: 100 },
    '@/lib/api': { apiFetch(path, options) {
      if (path === '/api/models/history') return Promise.resolve([{ id: modelId, version_number: 1, is_active: true, status: 'completed', dataset_size: 12, training_date: '2026-11-13', pca_n_components: 2, kmeans_n_clusters: 4, cluster_distribution: {}, cluster_labels: {} }]);
      const request = { ...deferred(), signal: options.signal }; pointRequests.push(request); return request.promise;
    } },
  }, { fetch: async () => ({ ok: true }) }).default;
  const models = () => modelHooks.render(Models);
  models(); await flush(); models();
  assert.equal(pointRequests.length, 1);
  modelId = 'second-model';
  find(models(), node => node.type === 'Button' && text(node).trim() === 'Refresh').props.onClick();
  await flush(); models();
  assert.equal(pointRequests.length, 2);
  assert.equal(pointRequests[0].signal.aborted, true, 'Changing active model cancels previous points request');
  pointRequests[1].resolve([{ student_id: 'current' }]); await flush();
  pointRequests[0].resolve([{ student_id: 'stale' }]); await flush();
  assert.equal(find(models(), node => node.type === 'Chart').props.points[0].student_id, 'current', 'Late points cannot overwrite the active model');
  modelId = 'third-model';
  find(models(), node => node.type === 'Button' && text(node).trim() === 'Refresh').props.onClick();
  await flush(); models(); modelHooks.unmount();
  assert.equal(pointRequests[2].signal.aborted, true, 'Leaving models cancels pending points request');

  const h = hooks();
  const { useApiResource } = load('src/hooks/use-api-resource.ts', { react: h.api });
  const first = deferred(), second = deferred();
  let signal, request = first;
  const fetcher = s => { signal = s; return request.promise; };
  const render = () => h.render(() => useApiResource(fetcher));
  assert.equal(render().pending, true);
  first.resolve({ count: 7 }); await flush();
  assert.equal(render().data.count, 7);
  request = second; render().reload(); render();
  assert.equal(render().pending, true);
  assert.equal(render().data.count, 7, 'Refresh keeps labelled previous data');
  second.reject(new Error('synthetic failure')); await flush();
  assert.equal(render().data, null, 'Failure must not masquerade as stale or zero data');
  assert.equal(render().error, 'synthetic failure');
  request = deferred(); render().reload(); render(); h.unmount();
  assert.equal(signal.aborted, true);
  request.resolve({ count: 999 }); await flush();
  assert.equal(render().data, null, 'Unmounted request cannot publish late data');

  const stale = hooks();
  const hook = load('src/hooks/use-api-resource.ts', { react: stale.api }).useApiResource;
  const old = deferred(), current = deferred();
  const oldLoader = () => old.promise, newLoader = () => current.promise;
  stale.render(() => hook(oldLoader)); stale.render(() => hook(newLoader));
  current.resolve({ count: 2 }); await flush(); old.resolve({ count: 1 }); await flush();
  assert.equal(stale.render(() => hook(newLoader)).data.count, 2, 'Replaced request cannot overwrite current data');
  stale.unmount();

  const charts = load('src/components/charts/dashboard-charts.tsx', { './editorial-tooltip': { makeEditorialAdapter: () => null } });
  const chart = charts.ClusterTrendChart({ data: [{ label: 'Uji', total: 6, cluster_counts: { 'Kelompok khusus': 4, 'Label berubah': 2 } }] });
  const bars = nodes(chart, node => node.type === 'Bar');
  assert.deepEqual(bars.map(bar => bar.props.name), ['Kelompok khusus', 'Label berubah']);
  assert.equal(bars[0].props.dataKey({ cluster_counts: { 'Kelompok khusus': 4 } }), 4);
  assert.equal(bars[0].props.dataKey({ cluster_counts: {} }), 0);
  assert.match(text(chart), /Lihat data kelompok/);
  assert.equal(nodes(chart, node => node.type === 'table').length, 1);

  const aiHooks = hooks();
  const calls = [];
  let reply = deferred();
  const AI = load('src/app/(dashboard)/ai/page.tsx', {
    react: aiHooks.api,
    '@/hooks/use-api-resource': { useApiResource: () => ({ data: null, pending: false, error: 'context unavailable', reload() {} }) },
    '@/lib/api': { getClusterContext() {}, chatWithAI(messages, options) { calls.push({ messages, options }); return reply.promise; } },
  }).default;
  const ai = () => aiHooks.render(AI);
  const draft = value => find(ai(), node => node.props?.id === 'ai-question').props.onChange({ target: { value } });
  const send = () => find(ai(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  draft('Tolong analisis data sintetis.'); send(); send();
  assert.equal(calls.length, 1, 'Double submit must not duplicate request');
  assert.match(text(ai()), /Sedang menyusun analisis/);
  reply.reject(new Error('synthetic outage')); await flush();
  assert.equal(find(ai(), node => node.props?.id === 'ai-question').props.value, 'Tolong analisis data sintetis.');
  assert.match(text(ai()), /synthetic outage/);
  reply = deferred(); send();
  assert.equal(calls[1].messages.length, 2, 'Retry excludes failed/error turns');
  reply.resolve({ message: 'Jawaban sintetis', model: 'test-model' }); await flush();
  assert.match(text(ai()), /Jawaban sintetis/);
  draft('Pertanyaan kedua'); reply = deferred(); send();
  assert.equal(calls[2].messages.length, 4, 'Successful conversation retained');
  let stopDefaultPrevented = false;
  find(ai(), node => node.type === 'Button' && text(node).includes('Hentikan')).props.onClick({ preventDefault() { stopDefaultPrevented = true; } });
  assert.ok(stopDefaultPrevented, 'Stopping must not submit the restored draft when the button changes type');
  assert.equal(calls[2].options.signal.aborted, true);
  assert.equal(find(ai(), node => node.props?.id === 'ai-question').props.value, 'Pertanyaan kedua');
  reply.resolve({ message: 'Late answer', model: 'test-model' }); await flush();
  assert.doesNotMatch(text(ai()), /Late answer/);
  draft('x'.repeat(4001)); send(); assert.equal(calls.length, 3);
  draft('Tidak dikirim saat komposisi teks');
  find(ai(), node => node.props?.id === 'ai-question').props.onKeyDown({ key: 'Enter', shiftKey: false, nativeEvent: { isComposing: true }, preventDefault() { throw new Error('IME composition intercepted'); } });
  assert.equal(calls.length, 3);
  for (let index = 0; index < 26; index++) {
    reply = deferred(); draft(`Pertanyaan uji ${index}`); send();
    reply.resolve({ message: 'a'.repeat(4100), model: 'test-model' }); await flush();
  }
  assert.equal(calls.at(-1).messages.length, 50);
  assert.ok(calls.at(-1).messages.every(message => message.content.length <= 4000));
  assert.ok(text(ai()).includes('a'.repeat(4100)), 'Complete answer retained in UI');
  reply = deferred(); draft('Meninggalkan halaman saat menunggu'); send();
  const leavingSignal = calls.at(-1).options.signal;
  aiHooks.unmount();
  assert.equal(leavingSignal.aborted, true, 'Leaving AI must cancel the pending request');
  reply.resolve({ message: 'Late unmounted answer' }); await flush();
  assert.doesNotMatch(text(ai()), /Late unmounted answer/);

  const apiSource = fs.readFileSync('src/lib/api.ts', 'utf8');
  assert.match(apiSource, /signal: options\?\.signal/);
  console.log('PASS metric animation/placeholder/reduced-motion/cleanup, active-model points cancellation, independent loading/retry, stale-response cancellation, dynamic cluster labels/table, AI double-send/error/retry/stop/history/input limits');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
