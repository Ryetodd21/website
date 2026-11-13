/* eslint-disable @typescript-eslint/no-require-imports -- Browser verification using an existing Playwright installation. */
// Run: NODE_PATH=/path/to/playwright/node_modules node scripts/workspace-browser-check.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.UI_EVIDENCE_DIR || '/tmp/monitor-ung-overhaul-evidence';
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3100';
assert(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname), 'Use a local frontend with synthetic API data');
fs.mkdirSync(out, {recursive:true});
const summary = {total_registered:128,active_students_week:112,pending_students:16,app_logs_week:650,seed_logs_week:0,avg_screen_time_today_min:84,avg_unlock_count_today:8,avg_social_media_time_today_min:12,avg_game_time_today_min:5,date:'2026-11-13'};
const user = {id:'synthetic-admin',sub:'synthetic-admin',username:'staf.uji',full_name:'Staf Akademik Uji',email:'staf@example.invalid',role:'admin',is_active:true};
const model = {id:'synthetic-model',version_number:2,is_active:true,status:'completed',training_date:'2026-11-13T08:00:00+08:00',dataset_size:128,pca_n_components:2,kmeans_n_clusters:4,silhouette_score:0.5,cluster_distribution:{0:40,1:30,2:50,3:8},cluster_labels:{0:'Pola mandiri',1:'Perlu ditinjau',2:'Kelompok khusus',3:'Kelompok tambahan'}};
const fixtures = {
 '/api/auth/me':user, '/api/users/me':user,
 '/api/institution':{university_name:'Universitas Negeri Gorontalo',faculty:'Lintas Fakultas',program:'Seluruh Program Studi'},
 '/api/reports/summary':summary,
 '/api/reports/screen-time':{trends:Array.from({length:7},(_,i)=>({date:`2026-11-${7+i}`,label:`${7+i} Nov`,log_count:12,avg_duration_min:40+i*8,total_duration_min:480+i*96}))},
 '/api/reports/cluster-trends':{trends:Array.from({length:4},(_,i)=>({label:`Periode ${i+1}`,date:'2026-11-13',start_date:'2026-11-07',end_date:'2026-11-13',avg_distraction_score:0.4,cluster_counts:{'Pola mandiri':40+i,'Perlu ditinjau':12+i,'Kelompok khusus':5},total:57+2*i}))},
 '/api/reports':{avg_distraction_score:0.4,total_students:128,cluster_counts:{'Pola mandiri':90,'Perlu ditinjau':30,'Kelompok khusus':8},cluster_labels:{0:'Pola mandiri',1:'Perlu ditinjau',2:'Kelompok khusus'},avg_screen_time:84,avg_unlock_count:8,avg_social_media_time:12,avg_game_time:5,data:[]},
 '/api/logs/geofence-summary':{days:7,inside:80,outside:20,unknown:12,inside_rate:0.8},
 '/api/models/history':[model], '/api/models/results/latest':[], '/api/models/results/points':[],
 '/api/ai/context':{model:{v:2,k:4,pca:2,sil:0.5,ds:128,dist:{},lbl:{}},total:128,clustered:112,week:{sot:84,unlock:8,logs:650},top_high:[],top_low:[],cluster_summary:{}},
 '/api/students':{items:[],total:0,page:1,page_size:20,cluster_distribution:model.cluster_distribution,active_model_version:2},
 '/api/logs/history':[], '/api/users':[user],
 '/api/auth/devices':[{id:'synthetic-device',device_id:'browser-test',device_name:'Browser Uji',user_agent:'Synthetic browser',first_seen:'2026-11-13T08:00:00+08:00',last_seen:new Date().toISOString(),is_current:true}],
 '/api/status':{}, '/api/seed/status':{students_in_definition:0,students_in_db:0,logs_in_db:0,logs_from_seed:0,seed_data_ready:false},
};
async function setup(page, state={}) {
 await page.route('**/api/**', async route=>{
  const path = new URL(route.request().url()).pathname;
  if(state.wait===path) await new Promise(r=>setTimeout(r,500));
  if(state.fail===path) return route.fulfill({status:503,json:{detail:'Gangguan uji. Coba kembali.'}});
  if(path==='/api/ai/chat') {
   state.calls=(state.calls||0)+1;
   if(state.delay) await new Promise(r=>setTimeout(r,state.delay));
   return route.fulfill({json:{message:'## Hasil analisis\n\nData **sintetis** untuk pengujian.\n\n| Kelompok | Jumlah |\n| --- | --- |\n| Pola mandiri | 90 |\n\nTinjau kelengkapan data sebelum pendampingan.',model:'model-uji',usage:{total_tokens:100}}});
  }
  await route.fulfill({json:state.overrides?.[path] ?? fixtures[path] ?? []});
 });
 await page.routeWebSocket('**/*', ws=>ws.close());
 await page.route('https://*.tile.openstreetmap.org/**', route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
}
async function fits(page, label) {
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Horizontal overflow: ${label}`);
}
async function visibleWithin(page, selector) {
 const box=await page.locator(selector).boundingBox();
 assert(box && box.x>=0 && box.y>=0 && box.x+box.width<=page.viewportSize().width+1 && box.y+box.height<=page.viewportSize().height+1, `Clipped: ${selector}`);
}
async function main() {
 const browser=await chromium.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},bypassCSP:true,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const state={};await setup(page,state);
  const routes=['dashboard','ai','monitoring','students','logs','reports','models','akademik','settings','profile','','login','register','privacy','changelog'];
  for(const route of routes) {
   await page.goto(`${base}/${route}`);
   await page.getByRole('main').waitFor();
   await page.waitForTimeout(450);
   assert(!await page.getByRole('heading',{name:'Halaman tidak dapat ditampilkan'}).count(), `Error boundary: ${route}`);
   for(const theme of ['light','dark']) {
    await page.evaluate(theme=>{localStorage.setItem('monitor-ung-theme',theme);document.documentElement.classList.toggle('dark',theme==='dark');},theme);
    if(route==='dashboard') {
     const ratio=await page.locator('.dashboard-metric').first().evaluate(card=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
      const ctx=canvas.getContext('2d');
      const luminance=color=>{
       ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);
       const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(value=>value/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
       return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
      };
      const a=luminance(getComputedStyle(card.querySelector('p')).color),b=luminance(getComputedStyle(card).backgroundColor);
      return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
     });
     assert(ratio>=4.5,`Metric label contrast ${theme}: ${ratio}`);
     console.log(`PASS metric label contrast ${theme}: ${ratio.toFixed(2)}:1`);
    }
    for(const width of route==='' ? [320,375,768,1024,1440,1920] : [375,768,1024,1440]) {
     await page.setViewportSize({width,height:1000});await page.waitForTimeout(80);
     if(route==='dashboard') await page.waitForFunction(()=>{
      const charts=[...document.querySelectorAll('.recharts-responsive-container')];
      return charts.length===3 && charts.every(chart=>{
       const svg=chart.querySelector('svg.recharts-surface[role="application"]');
       return svg && Math.abs(svg.getBoundingClientRect().width-chart.clientWidth)<=1;
      });
     });
     await fits(page,`${route} ${theme} ${width}`);
     if(route==='') {
      const title=page.getByRole('heading',{name:'Monitor UNG',exact:true});
      const geometry=await title.evaluate(el=>({height:el.getBoundingClientRect().height,fontSize:parseFloat(getComputedStyle(el).fontSize)}));
      assert(geometry.height<geometry.fontSize*2.6,`Compact hero title ${theme} ${width}`);
      assert.equal(await page.locator('#tim svg rect').count(),0,'Team ornament removed');
      await page.getByText('Ilustrasi aktivitas mahasiswa dan ringkasan staf',{exact:true}).waitFor();
      if([375,1440,1920].includes(width)) {
       await page.locator('main > section').first().screenshot({path:`${out}/landing-hero-${width}-${theme}.png`});
       await page.locator('#tim').scrollIntoViewIfNeeded();await page.waitForTimeout(700);
       await page.locator('#tim').screenshot({path:`${out}/landing-team-${width}-${theme}.png`});
       await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      }
     }
     if([375,1440].includes(width)) await page.screenshot({path:`${out}/${route}-${width}-${theme}.png`,fullPage:true});
    }
   }
   console.log(`PASS ${route}: 375/768/1024/1440, light/dark`);
   if(route==='') {
    const title=page.getByRole('heading',{name:'Monitor UNG',exact:true});
    const before=await title.boundingBox();
    const word=await title.locator('span').first().innerText();
    await page.waitForFunction(previous=>document.querySelector('h1 > span').innerText!==previous,word);
    const after=await title.boundingBox();
    assert(Math.abs(before.height-after.height)<1,'Language cycling must not change title height');
    console.log('PASS landing: compact title 320-1920, stable language cycle, new SVG, removed team ornament');
   }
   if(['dashboard','ai','students'].includes(route)) fs.writeFileSync(`${out}/${route}-accessibility.txt`,await page.locator('main').ariaSnapshot());
  }
  await page.goto(`${base}/login`);
  for(const theme of ['light','dark']) {
   await page.evaluate(theme=>document.documentElement.classList.toggle('dark',theme==='dark'),theme);
   await page.waitForTimeout(250);
   for(const [selector, property, expected] of [
    ['html','--primary','oklch(0.577 0.245 27.325)'],
    ['button[type="submit"]','background-color','oklch(0.444 0.177 26.899)'],
    ['a[href="/register"]','color',theme==='light'?'oklch(0.505 0.213 27.518)':'oklch(0.808 0.114 19.571)'],
    ['h2','color',theme==='light'?'#000':'oklch(0.96 0.004 80)'],
   ]) {
    const colors=await page.locator(selector).first().evaluate((el,{property,expected})=>{
     const ctx=document.createElement('canvas').getContext('2d');
     const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
     return [rgba(getComputedStyle(el).getPropertyValue(property)),rgba(expected)];
    },{property,expected});
    assert.deepEqual(colors[0],colors[1],`${theme} ${selector} ${property}`);
   }
  }
  console.log('PASS brand red-600, action red-800, links red-700/light red-300/dark, black/light readable/dark text');

  await page.goto(`${base}/settings`);
  await page.getByRole('button',{name:'Kelola Akun',exact:false}).click();
  await page.locator('table').getByText('@staf.uji',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Titik Kampus',exact:false}).click();
  for(let attempt=0;attempt<2;attempt++) {
   await page.getByRole('button',{name:'Tambah Titik',exact:true}).click();
   const dialog=page.getByRole('dialog'), map=dialog.locator('.leaflet-container');
   await map.waitFor();
   await dialog.locator('.leaflet-picker-marker').waitFor();
   const coordinates=dialog.locator('input[type="number"]');
   const before=await coordinates.first().inputValue();
   await map.click({position:{x:100,y:100}});
   await page.waitForFunction(previous=>document.querySelector('[role="dialog"] input[type="number"]').value!==previous,before);
   assert.notEqual(await coordinates.first().inputValue(),before,'Map click updates controlled coordinates');
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
  }
  await page.goto(`${base}/profile`);
  await page.getByRole('tab',{name:'Keamanan',exact:true}).click();
  await page.getByText('Browser Uji',{exact:true}).waitFor();
  assert(!(await page.locator('main').innerText()).includes('NaN'));
  state.fail='/api/auth/logout';
  await page.getByRole('button',{name:'Logout dari semua perangkat',exact:true}).click();
  await page.getByText('Gangguan uji. Coba kembali.',{exact:true}).waitFor();
  assert.equal(new URL(page.url()).pathname,'/profile','Failed logout keeps the current page');
  state.fail=null;
  await page.getByRole('button',{name:'Logout dari semua perangkat',exact:true}).click();
  await page.waitForURL('**/login');
  console.log('PASS settings users load, async map click/close/reopen, profile device timestamps, failed/successful logout');

  await page.goto(`${base}/dashboard`);
  await page.getByRole('heading',{name:'Ringkasan aktivitas belajar'}).waitFor();
  await page.locator('.dashboard-metric').first().waitFor();
  assert.equal(await page.locator('[data-slot="sidebar-container"]').evaluate(el=>el.getBoundingClientRect().top),0);
  await page.getByRole('button',{name:'Ciutkan navigasi'}).click();
  await page.keyboard.press('Tab');
  await page.getByRole('link',{name:'AI Analisis',exact:true}).first().focus();
  await page.locator('[data-slot="tooltip-content"]').filter({hasText:'AI Analisis'}).waitFor();
  await page.getByRole('button',{name:'Perluas navigasi'}).click();
  const search=page.getByRole('button',{name:'Cari halaman atau mahasiswa'});
  await search.focus();await page.keyboard.press('Control+k');
  await page.getByRole('dialog').waitFor();
  await page.getByLabel('Cari halaman, nama, atau NIM').fill('AI');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await page.waitForURL('**/ai');
  await page.getByRole('heading',{name:'AI Analisis',exact:true}).waitFor();
  await page.getByRole('button',{name:'Pahami kelompok',exact:false}).click();
  const question=page.getByLabel('Pertanyaan Anda');
  assert((await question.inputValue()).startsWith('Jelaskan'));
  state.delay=400;
  await page.getByRole('button',{name:'Kirim',exact:true}).click();
  await question.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Salin jawaban 1'}).waitFor();
  assert.equal(state.calls,1,'Prevent duplicate AI requests');
  await page.getByRole('button',{name:'Salin jawaban 1'}).click();
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Data \*\*sintetis\*\*/);
  await question.fill('Pertanyaan gagal');state.fail='/api/ai/chat';
  await page.getByRole('button',{name:'Kirim',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Gangguan uji'}).waitFor();
  assert.equal(await question.inputValue(),'Pertanyaan gagal');
  state.fail=null;await page.getByRole('button',{name:'Kirim kembali'}).click();
  await page.getByRole('button',{name:'Salin jawaban 2'}).waitFor();
  state.delay=1200;await question.fill('Batalkan pertanyaan');
  await page.getByRole('button',{name:'Kirim',exact:true}).click();
  const callsBeforeStop=state.calls;
  await page.getByRole('button',{name:'Hentikan'}).click();
  await page.waitForTimeout(1300);
  assert.equal(await question.inputValue(),'Batalkan pertanyaan');
  assert.equal(state.calls,callsBeforeStop,'Stop must not resubmit the restored question');
  await page.getByRole('button',{name:'Percakapan baru',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForFunction(()=>!!document.activeElement.closest('[role="dialog"]'));
  for(let i=0;i<6;i++) {
   await page.keyboard.press('Tab');
   await page.waitForFunction(()=>!!document.activeElement.closest('[role="dialog"]'));
  }
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.waitForTimeout(100);
  assert(await page.getByRole('button',{name:'Percakapan baru',exact:true}).evaluate(el=>el===document.activeElement),'Restore focus');
  await page.getByRole('button',{name:'Percakapan baru',exact:true}).click();
  await page.getByRole('button',{name:'Mulai baru',exact:true}).click();
  assert.equal(await question.inputValue(),'');
  assert.equal(await page.getByRole('button',{name:/Salin jawaban/}).count(),0);
  console.log('PASS AI: suggestions, double send, copy, error/retry, cancel, reset, keyboard focus');

  state.fail='/api/ai/context';await page.reload();
  await page.getByRole('alert').filter({hasText:'Gangguan uji'}).waitFor();
  state.fail=null;await page.getByRole('button',{name:'Coba lagi',exact:true}).click();
  await page.getByRole('button',{name:'Perbarui konteks',exact:true}).waitFor();

  state.wait='/api/reports/summary';
  await page.goto(`${base}/dashboard`);
  await page.locator('[aria-label="Ringkasan mahasiswa"][aria-busy="true"]').waitFor();
  await page.locator('.dashboard-metric').filter({hasText:'128'}).waitFor();
  state.wait=null;state.fail='/api/reports/summary';
  await page.goto(`${base}/dashboard`);
  await page.getByRole('alert').filter({hasText:'Gangguan uji'}).waitFor();
  assert.equal(await page.locator('.dashboard-metric').count(),0,'No stale summary on failure');
  await page.getByText('Kelompok khusus',{exact:true}).first().waitFor();
  state.fail=null;
  await page.getByRole('button',{name:'Coba lagi',exact:true}).click();
  await page.locator('.dashboard-metric').filter({hasText:'128'}).waitFor();
  state.overrides={'/api/reports/summary':{...summary,total_registered:0,active_students_week:0,pending_students:0,avg_screen_time_today_min:0},'/api/reports/screen-time':{trends:[]},'/api/reports/cluster-trends':{trends:[]},'/api/logs/geofence-summary':{days:7,inside:0,outside:0,unknown:4,inside_rate:0},'/api/models/history':[]};
  await page.getByRole('button',{name:'Perbarui',exact:true}).click();
  await page.getByText('Belum ada data',{exact:true}).first().waitFor();
  assert(!(await page.locator('main').innerText()).includes('NaN'));
  state.overrides={};
  console.log('PASS dashboard: partial failure, retry, zero, empty, unknown location, dynamic clusters');

  await page.goto(`${base}/students`);
  await page.getByRole('button',{name:'Kelompok tambahan',exact:true}).waitFor();
  assert.equal(await page.getByText('Bermasalah',{exact:true}).count(),0);
  assert.equal(await page.getByText('Pembaruan langsung terhubung',{exact:true}).count(),0);
  await page.setViewportSize({width:375,height:812});
  await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/students'), page.getByRole('button',{name:'Kelompok tambahan',exact:true}).click()]);
  const label=page.getByRole('heading',{name:'Belum ada mahasiswa untuk ditampilkan'});
  await label.waitFor();await label.scrollIntoViewIfNeeded();
  assert((await label.boundingBox()).width<=343,'Empty state fits viewport');
  state.fail='/api/students';await page.getByRole('button',{name:'Bersihkan',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Gangguan uji'}).waitFor();
  state.fail=null;await page.getByRole('button',{name:'Coba lagi',exact:true}).click();
  await label.waitFor();
  console.log('PASS students: dynamic fourth cluster, empty layout, error/retry, honest status');

  await page.evaluate(()=>window.scrollTo(0,0));
  await page.getByRole('button',{name:'Notifikasi',exact:true}).click();
  await page.locator('[data-slot="popover-content"]').waitFor();
  await visibleWithin(page,'[data-slot="popover-content"]');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('dialog').getByRole('link',{name:'AI Analisis',exact:true}).click();
  await page.waitForURL('**/ai');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await fits(page,'AI mobile after menu');
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.evaluate(()=>localStorage.setItem('monitor-ung-theme','system'));
  await page.reload();
  await page.getByLabel('Pertanyaan Anda').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  assert(await page.locator('.dashboard-shell').evaluate(el=>[...el.querySelectorAll('*')].every(node=>getComputedStyle(node).animationName==='none')),'Reduced motion');
  // Emulate the CSS viewport and pixel density of a 1440x1000 window at 200% browser zoom.
  await page.setViewportSize({width:720,height:500});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:720,height:500,deviceScaleFactor:2,mobile:false});
  await fits(page,'AI effective viewport at 200% zoom');
  const zoomCapture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(`${out}/ai-zoom-200.png`,Buffer.from(zoomCapture.data,'base64'));
  assert.deepEqual(errors,[]);
  console.log('PASS mobile menu, notifications, system theme, reduced motion, emulated zoom 200%; no page errors');
 } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
