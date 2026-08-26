// Local app generation and modification helpers.
// A deterministic, local generation engine. It never calls a model or an
// external service: prompts select an interactive template, while follow-up
// prompts are translated into safe, supported HTML transformations.

interface ShellOpts {
  title: string;
  style: string;
  body: string;
  script: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[char];
  });
}

function injectBefore(html: string, marker: string, addition: string): string {
  return html.includes(marker) ? html.replace(marker, addition + marker) : html + addition;
}

function shell(o: ShellOpts): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${o.title}</title>
<style>
  :root{
    --bg:#f8fafc; --card:#ffffff; --text:#0f172a; --muted:#64748b;
    --primary:#6366f1; --primary-d:#4f46e5; --border:#e2e8f0; --ok:#10b981; --danger:#ef4444;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  ${o.style}
</style>
</head>
<body>
${o.body}
<script>
(function(){
try{
${o.script}
}catch(e){ console.error(e); }
})();
</script>
</body>
</html>`;
}

const CARD = `
.card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(15,23,42,.06);max-width:520px;margin:48px auto;width:calc(100% - 32px)}
.btn{background:var(--primary);color:#fff;border:0;border-radius:10px;padding:11px 16px;font-size:14px;font-weight:600;cursor:pointer;margin:4px}
.btn:hover{background:var(--primary-d)}
.btn.sec{background:#eef2ff;color:var(--primary-d)}
.btn.sec:hover{background:#e0e7ff}
input,select,textarea{padding:10px 12px;border:1px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit}
h1{font-size:22px;margin:0 0 4px}
.sub{color:var(--muted);font-size:14px;margin:0 0 18px}
`;

function pomodoro(): ShellOpts {
  return {
    title: "Focus Timer",
    style: `
${CARD}
.center{text-align:center}
.timer-visual{position:relative;display:grid;place-items:center;margin:6px auto 10px;width:190px;height:190px}
.timer-visual svg{width:190px;height:190px;transform:rotate(-90deg)}
.timer-track,.timer-progress{fill:none;stroke-width:10}.timer-track{stroke:#e2e8f0}.timer-progress{stroke:var(--primary);stroke-linecap:round;transition:stroke-dashoffset .3s linear}
.timer-copy{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring{font-size:38px;font-weight:800;font-variant-numeric:tabular-nums;margin:3px 0}
.mode{color:var(--muted);font-size:14px;margin-bottom:4px}
.row{display:flex;gap:8px;margin-top:14px}
.row input{flex:1}
ul{list-style:none;padding:0;margin:16px 0 0;text-align:left}
li{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
`,
    body: `
<div class="card center">
  <div class="timer-visual" data-local-progress>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="timer-track" cx="60" cy="60" r="52"></circle>
      <circle class="timer-progress" id="progress-ring" cx="60" cy="60" r="52" stroke-dasharray="326.73" stroke-dashoffset="0"></circle>
    </svg>
    <div class="timer-copy">
      <div class="mode" id="mode">Focus</div>
      <div class="ring" id="time">25:00</div>
    </div>
  </div>
  <div>
    <button class="btn" id="start">Start</button>
    <button class="btn sec" id="pause">Pause</button>
    <button class="btn sec" id="reset">Reset</button>
  </div>
  <div class="row">
    <input id="task" placeholder="Add a task..." />
    <button class="btn" id="add">Add</button>
  </div>
  <ul id="list"></ul>
  <div id="done" style="color:var(--muted);font-size:13px;margin-top:10px"></div>
</div>`,
    script: `
var KEY='pa_pomo_tasks';
var tasks=[];
try{ tasks=JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ tasks=[]; }
var total=25*60, left=total, timer=null, running=false, mode='focus';
function fmt(s){ var m=Math.floor(s/60), ss=s%60; return (m<10?'0':'')+m+':'+(ss<10?'0':'')+ss; }
function render(){
  document.getElementById('time').textContent=fmt(left);
  document.getElementById('mode').textContent = mode==='focus'?'Focus':'Break';
  var progress=document.getElementById('progress-ring');
  if(progress){ progress.style.strokeDashoffset=String(326.73*(1-left/total)); }
  var ul=document.getElementById('list'); ul.innerHTML='';
  tasks.forEach(function(t,i){
    var li=document.createElement('li');
    var span=document.createElement('span'); span.textContent=(t.done?'✓ ':'')+t.text;
    if(t.done) span.style.textDecoration='line-through';
    var b=document.createElement('button'); b.textContent='✕'; b.className='btn sec'; b.style.padding='4px 10px';
    b.onclick=function(){ tasks.splice(i,1); save(); render(); };
    li.appendChild(span); li.appendChild(b); ul.appendChild(li);
  });
  var done=tasks.filter(function(t){return t.done;}).length;
  document.getElementById('done').textContent = tasks.length? (done+'/'+tasks.length+' done') : '';
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(tasks)); }catch(e){} }
function tick(){
  if(left>0){ left--; render(); }
  else { clearInterval(timer); running=false; mode = mode==='focus'?'break':'focus'; total=(mode==='focus'?25:5)*60; left=total; render(); }
}
document.getElementById('start').onclick=function(){ if(running) return; running=true; timer=setInterval(tick,1000); };
document.getElementById('pause').onclick=function(){ running=false; clearInterval(timer); };
document.getElementById('reset').onclick=function(){ running=false; clearInterval(timer); mode='focus'; total=25*60; left=total; render(); };
document.getElementById('add').onclick=function(){
  var inp=document.getElementById('task'); var v=inp.value.trim(); if(!v) return;
  tasks.push({text:v,done:false}); inp.value=''; save(); render();
};
render();
`,
  };
}

function todo(): ShellOpts {
  return {
    title: "Todo List",
    style: `
${CARD}
.row{display:flex;gap:8px}
.row input{flex:1}
ul{list-style:none;padding:0;margin:16px 0 0}
li{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
li.done span{text-decoration:line-through;color:var(--muted)}
`,
    body: `
<div class="card">
  <h1>Todo List</h1>
  <p class="sub">Capture what needs doing.</p>
  <div class="row">
    <input id="task" placeholder="What needs to be done?" />
    <button class="btn" id="add">Add</button>
  </div>
  <ul id="list"></ul>
</div>`,
    script: `
var KEY='pa_todo';
var items=[];
try{ items=JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ items=[]; }
function render(){
  var ul=document.getElementById('list'); ul.innerHTML='';
  items.forEach(function(it,i){
    var li=document.createElement('li'); if(it.done) li.className='done';
    var cb=document.createElement('input'); cb.type='checkbox'; cb.checked=it.done;
    cb.onchange=function(){ items[i].done=cb.checked; save(); render(); };
    var span=document.createElement('span'); span.textContent=it.text; span.style.flex='1';
    var b=document.createElement('button'); b.textContent='✕'; b.className='btn sec'; b.style.padding='4px 10px';
    b.onclick=function(){ items.splice(i,1); save(); render(); };
    li.appendChild(cb); li.appendChild(span); li.appendChild(b); ul.appendChild(li);
  });
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){} }
document.getElementById('add').onclick=function(){
  var inp=document.getElementById('task'); var v=inp.value.trim(); if(!v) return;
  items.push({text:v,done:false}); inp.value=''; save(); render();
};
render();
`,
  };
}

function expense(): ShellOpts {
  return {
    title: "Expense Tracker",
    style: `
${CARD}
.row{display:flex;gap:8px;flex-wrap:wrap}
.row input,.row select{flex:1;min-width:120px}
.total{font-size:30px;font-weight:800;margin:6px 0 14px}
ul{list-style:none;padding:0;margin:0}
li{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
.tag{font-size:12px;color:var(--muted);background:#eef2ff;padding:2px 8px;border-radius:999px}
.amt{font-weight:700}
`,
    body: `
<div class="card">
  <h1>Expense Tracker</h1>
  <p class="sub">Add expenses, pick a category, watch the total.</p>
  <div class="total">Total: $<span id="total">0.00</span></div>
  <div class="row">
    <input id="desc" placeholder="Description" />
    <input id="amt" type="number" placeholder="0.00" />
    <select id="cat">
      <option>Food</option><option>Transport</option><option>Home</option>
      <option>Fun</option><option>Other</option>
    </select>
    <button class="btn" id="add">Add</button>
  </div>
  <ul id="list"></ul>
</div>`,
    script: `
var KEY='pa_expense';
var items=[];
try{ items=JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ items=[]; }
function render(){
  var ul=document.getElementById('list'); ul.innerHTML='';
  var sum=0;
  items.forEach(function(it,i){
    sum+=it.amt;
    var li=document.createElement('li');
    var left=document.createElement('div');
    left.innerHTML='<div>'+escapeHtml(it.desc)+'</div><span class="tag">'+escapeHtml(it.cat)+'</span>';
    var right=document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.style.gap='10px';
    var a=document.createElement('span'); a.className='amt'; a.textContent='$'+it.amt.toFixed(2);
    var b=document.createElement('button'); b.textContent='✕'; b.className='btn sec'; b.style.padding='4px 10px';
    b.onclick=function(){ items.splice(i,1); save(); render(); };
    right.appendChild(a); right.appendChild(b);
    li.appendChild(left); li.appendChild(right); ul.appendChild(li);
  });
  document.getElementById('total').textContent=sum.toFixed(2);
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){} }
document.getElementById('add').onclick=function(){
  var d=document.getElementById('desc').value.trim();
  var a=parseFloat(document.getElementById('amt').value);
  var c=document.getElementById('cat').value;
  if(!d||isNaN(a)) return;
  items.push({desc:d,amt:a,cat:c}); 
  document.getElementById('desc').value=''; document.getElementById('amt').value='';
  save(); render();
};
render();
`,
  };
}

function calculator(): ShellOpts {
  return {
    title: "Calculator",
    style: `
.wrap{max-width:320px;margin:60px auto;width:calc(100% - 32px)}
.display{background:#0f172a;color:#fff;font-size:30px;font-weight:700;text-align:right;padding:18px;border-radius:14px;overflow:hidden}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.key{padding:16px;font-size:18px;border:0;border-radius:12px;background:#eef2ff;color:#0f172a;cursor:pointer;font-weight:600}
.key.op{background:var(--primary);color:#fff}
.key.eq{background:var(--ok);color:#fff}
.key:active{transform:translateY(1px)}
`,
    body: `
<div class="wrap">
  <div class="display" id="disp">0</div>
  <div class="grid" id="grid"></div>
</div>`,
    script: `
var keys=['C','±','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
var disp=document.getElementById('disp'); var expr='';
var grid=document.getElementById('grid');
function refresh(){ disp.textContent = expr===''?'0':expr; }
keys.forEach(function(k){
  var b=document.createElement('button'); b.textContent=k;
  b.className='key'+(k==='/'||k==='*'||k==='-'||k==='+'?' op':'')+(k==='='?' eq':'');
  b.onclick=function(){
    if(k==='C'){ expr=''; }
    else if(k==='='){ try{ var v=Function('return ('+expr+')')(); expr=String(Math.round(v*1e8)/1e8); }catch(e){ expr='Error'; } }
    else if(k==='±'){ expr=expr.charAt(0)==='-'?expr.slice(1):'-'+expr; }
    else if(k==='%'){ try{ var n=Function('return ('+expr+')')(); expr=String(n/100); }catch(e){ expr='Error'; } }
    else { if(expr==='Error') expr=''; expr+=k; }
    refresh();
  };
  grid.appendChild(b);
});
refresh();
`,
  };
}

function landing(): ShellOpts {
  return {
    title: "Landing Page",
    style: `
.hero{max-width:760px;margin:0 auto;padding:80px 20px;text-align:center}
.badge{display:inline-block;background:#eef2ff;color:var(--primary-d);padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:18px}
h1{font-size:44px;line-height:1.1;margin:0 0 14px}
p.lead{font-size:18px;color:var(--muted);max-width:560px;margin:0 auto 26px}
.cta{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:14px 26px;font-size:16px;font-weight:700;cursor:pointer}
.cta:hover{background:var(--primary-d)}
`,
    body: `
<div class="hero">
  <span class="badge">New</span>
  <h1>Build something people love</h1>
  <p class="lead">A clean, modern landing page you can edit with a single prompt. Change the copy, colors and layout by chatting with your assistant.</p>
  <button class="cta" onclick="alert('Get started!')">Get started</button>
</div>`,
    script: `
// Interactive landing page placeholder.
console.log('Landing page ready');
`,
  };
}

function notes(): ShellOpts {
  return {
    title: "Notes",
    style: `
${CARD}
textarea{width:100%;min-height:240px;resize:vertical;font-family:inherit}
.bar{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
`,
    body: `
<div class="card">
  <h1>Notes</h1>
  <p class="sub">Everything you type is saved locally.</p>
  <textarea id="note" placeholder="Start writing..."></textarea>
  <div class="bar">
    <span class="sub" id="count">0 characters</span>
    <button class="btn sec" id="clear">Clear</button>
  </div>
</div>`,
    script: `
var KEY='pa_notes';
var ta=document.getElementById('note'); var count=document.getElementById('count');
try{ ta.value=localStorage.getItem(KEY)||''; }catch(e){}
function update(){ count.textContent=ta.value.length+' characters'; try{ localStorage.setItem(KEY, ta.value); }catch(e){} }
ta.addEventListener('input', update);
document.getElementById('clear').onclick=function(){ if(confirm('Clear all notes?')){ ta.value=''; update(); } };
update();
`,
  };
}

function countdown(): ShellOpts {
  return {
    title: "Countdown",
    style: `
${CARD}
.center{text-align:center}
.big{font-size:54px;font-weight:800;font-variant-numeric:tabular-nums;margin:14px 0}
.row{display:flex;gap:8px;justify-content:center}
`,
    body: `
<div class="card center">
  <h1>Countdown</h1>
  <div class="big" id="disp">00:00:00</div>
  <div class="row">
    <input id="mins" type="number" placeholder="Minutes" style="width:110px" />
    <button class="btn" id="start">Start</button>
    <button class="btn sec" id="reset">Reset</button>
  </div>
</div>`,
    script: `
var timer=null, left=0;
function fmt(s){ var h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=s%60;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(ss<10?'0':'')+ss; }
function render(){ document.getElementById('disp').textContent=fmt(left); }
document.getElementById('start').onclick=function(){
  var mins=parseInt(document.getElementById('mins').value,10); if(isNaN(mins)||mins<1) return;
  left=mins*60; clearInterval(timer); timer=setInterval(function(){ if(left>0){left--;render();} else clearInterval(timer); },1000); render();
};
document.getElementById('reset').onclick=function(){ clearInterval(timer); left=0; render(); };
render();
`,
  };
}

function fallback(prompt: string): ShellOpts {
  const safe = prompt.replace(/[<>&"]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] as string;
  });
  return {
    title: "Your App",
    style: `
${CARD}
.idea{white-space:pre-wrap;background:#f1f5f9;border-radius:12px;padding:16px;color:var(--text);font-size:15px}
.row{display:flex;gap:8px;margin-top:16px}
.row textarea{flex:1}
`,
    body: `
<div class="card">
  <h1>Your App</h1>
  <p class="sub">The local agent generated a starter shell for your idea. Add notes below; they are saved in this browser.</p>
  <div class="idea">${safe}</div>
  <div class="row">
    <textarea id="pad" placeholder="Jot notes here (saved locally)..."></textarea>
  </div>
</div>`,
    script: `
var KEY='pa_idea';
var pad=document.getElementById('pad');
try{ pad.value=localStorage.getItem(KEY)||''; }catch(e){}
pad.addEventListener('input', function(){ try{ localStorage.setItem(KEY, pad.value); }catch(e){} });
`,
  };
}

interface TemplateDef {
  match: RegExp[];
  name: string;
  summary: string;
  build: () => ShellOpts;
}

const TEMPLATES: TemplateDef[] = [
  { match: [/pomodoro|focus|timer|番茄/i], name: "Focus Timer", summary: "A pomodoro timer with a task list", build: pomodoro },
  { match: [/expense|spend|cost|tracker|预算|开销/i], name: "Expense Tracker", summary: "An expense tracker with categories and totals", build: expense },
  { match: [/todo|task list|to-do|待办/i], name: "Todo List", summary: "A simple todo list", build: todo },
  { match: [/calculator|calc|计算/i], name: "Calculator", summary: "A basic calculator", build: calculator },
  { match: [/countdown|倒计时/i], name: "Countdown", summary: "A countdown timer", build: countdown },
  { match: [/landing|page|website|marketing|主页|落地/i], name: "Landing Page", summary: "A clean landing page", build: landing },
  { match: [/note|笔记|日记/i], name: "Notes", summary: "A notes app", build: notes },
];

export interface DemoResult {
  name: string;
  summary: string;
  html: string;
}

export function generateDemo(prompt: string): DemoResult {
  const lower = prompt.toLowerCase();
  const found = TEMPLATES.find((t) => t.match.some((re) => re.test(lower)));
  if (found) {
    return { name: found.name, summary: found.summary, html: shell(found.build()) };
  }
  return { name: "Your App", summary: "A starter app shell", html: shell(fallback(prompt)) };
}

export interface DemoModifyResult {
  summary: string;
  html: string;
}

// Demo-mode modify: apply a couple of cheap, visible heuristics so the loop is
// demonstrable without a model. Clearly labelled as demo.
function legacyDemoModify(prompt: string, currentHtml: string): DemoModifyResult {
  const p = prompt.toLowerCase();
  let html = currentHtml;
  let summary = "Updated the app (demo mode)";

  if (/(dark|night|black|暗色|深色)/.test(p)) {
    const override =
      '<style>body{background:#0f172a!important;color:#e2e8f0!important}' +
      ".card,div[class*='card']{background:#1e293b!important;border-color:#334155!important}" +
      "input,select,textarea{background:#0b1220!important;color:#e2e8f0!important;border-color:#334155!important}" +
      "button{background:#6366f1!important;color:#fff!important}" +
      ".sub,.mode,.tag{color:#94a3b8!important}</style>";
    if (html.includes("</head>")) html = html.replace("</head>", override + "</head>");
    else html = override + html;
    summary = "Applied dark mode (demo mode)";
  } else if (/(title|heading|name|标题)/.test(p)) {
    summary =
      "Legacy rule set: only basic local changes are supported.";
  } else {
    summary =
      "Legacy rule set: the existing app structure was kept intact.";
  }
  return { summary, html };
}

type Theme = {
  name: string;
  primary: string;
  primaryDark: string;
  soft: string;
  dark?: boolean;
};

const THEMES: Array<Theme & { match: RegExp }> = [
  { name: "dark mode", primary: "#818cf8", primaryDark: "#6366f1", soft: "#1e293b", dark: true, match: /dark|night|black|暗色|深色|夜间/ },
  { name: "light mode", primary: "#6366f1", primaryDark: "#4f46e5", soft: "#ffffff", match: /light|bright|白色|浅色|明亮/ },
  { name: "emerald theme", primary: "#059669", primaryDark: "#047857", soft: "#ecfdf5", match: /green|emerald|mint|绿色|绿/ },
  { name: "rose theme", primary: "#e11d48", primaryDark: "#be123c", soft: "#fff1f2", match: /red|rose|pink|coral|红色|粉色/ },
  { name: "amber theme", primary: "#d97706", primaryDark: "#b45309", soft: "#fffbeb", match: /orange|amber|yellow|gold|橙色|黄色|金色/ },
  { name: "sky theme", primary: "#0284c7", primaryDark: "#0369a1", soft: "#f0f9ff", match: /blue|sky|ocean|蓝色|海洋/ },
];

function upsertStyle(html: string, key: string, css: string): string {
  const tag = `<style data-local-agent="${key}">${css}</style>`;
  const pattern = new RegExp(`<style\\s+data-local-agent=["']${key}["']>[\\s\\S]*?<\\/style>`, "i");
  return pattern.test(html) ? html.replace(pattern, tag) : injectBefore(html, "</head>", tag);
}

function applyTheme(html: string, theme: Theme): string {
  const css = theme.dark
    ? `:root{--primary:${theme.primary};--primary-d:${theme.primaryDark};--bg:#0f172a;--card:${theme.soft};--text:#e2e8f0;--muted:#94a3b8;--border:#334155}body{background:var(--bg)!important;color:var(--text)!important}.card,div[class*='card']{background:var(--card)!important;border-color:var(--border)!important}input,select,textarea{background:#0b1220!important;color:var(--text)!important;border-color:var(--border)!important}.timer-track{stroke:#334155!important}`
    : `:root{--primary:${theme.primary};--primary-d:${theme.primaryDark};--bg:${theme.soft};--card:#ffffff;--text:#0f172a;--muted:#64748b;--border:#dbeafe}body{background:var(--bg)!important;color:var(--text)!important}`;
  return upsertStyle(html, "theme", css);
}

function requestedTitle(prompt: string): string | null {
  const patterns = [
    /\b(?:title|heading|called)\b\s*(?:to|as|is)?\s*["“']([^"”']{1,60})["”']/i,
    /\b(?:title|heading|called)\b\s*(?:to|as|is)?\s+([^.!?\n]{1,60})/i,
    /(?:标题|名称|名字)\s*(?:改成|改为|为|叫)?\s*[“"']?([^，。；\n“”"']{1,32})/,
  ];
  for (const pattern of patterns) {
    const value = pattern.exec(prompt)?.[1]?.trim();
    if (value) {
      const title = value
        .replace(/\s+/g, " ")
        .replace(/\s+(?:and|then)\s+.*$/i, "")
        .replace(/(?:并且|并|然后).*/, "")
        .trim();
      if (title) return title;
    }
  }
  return null;
}

function replaceTitle(html: string, title: string): string {
  const safe = escapeHtml(title);
  const withDocumentTitle = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safe}</title>`)
    : injectBefore(html, "</head>", `<title>${safe}</title>`);
  return /<h1[^>]*>[\s\S]*?<\/h1>/i.test(withDocumentTitle)
    ? withDocumentTitle.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${safe}</h1>`)
    : withDocumentTitle;
}

function addProgressWidget(html: string): string {
  if (html.includes("data-local-progress")) return html;
  const style = `.local-progress{display:flex;align-items:center;gap:14px;max-width:520px;margin:0 auto 18px;padding:14px 18px;border:1px solid var(--border);border-radius:16px;background:var(--card)}.local-progress svg{width:76px;height:76px;transform:rotate(-90deg);flex:none}.local-progress-track,.local-progress-value{fill:none;stroke-width:9}.local-progress-track{stroke:#e2e8f0}.local-progress-value{stroke:var(--primary);stroke-linecap:round;transition:stroke-dashoffset .25s linear}.local-progress-copy{min-width:0}.local-progress-copy strong{display:block;font-size:14px}.local-progress-copy span{display:block;margin-top:2px;font-size:13px;color:var(--muted)}`;
  const body = `<section class="local-progress" data-local-progress><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="local-progress-track" cx="50" cy="50" r="40"></circle><circle class="local-progress-value" data-local-progress-ring cx="50" cy="50" r="40" stroke-dasharray="251.33" stroke-dashoffset="0"></circle></svg><div class="local-progress-copy"><strong>Focus progress</strong><span data-local-progress-label>Ready for a 60 second focus session</span><button class="btn" type="button" data-local-progress-toggle>Start focus</button></div></section>`;
  const script = `<script data-local-agent="progress-script">(function(){var root=document.querySelector('[data-local-progress]');if(!root)return;var ring=root.querySelector('[data-local-progress-ring]');var label=root.querySelector('[data-local-progress-label]');var button=root.querySelector('[data-local-progress-toggle]');var total=60,left=60,timer=null;function render(){ring.style.strokeDashoffset=String(251.33*(1-left/total));label.textContent=left?'Focus session: '+left+'s remaining':'Focus session complete';button.textContent=timer?'Pause':'Start focus';}button.onclick=function(){if(timer){clearInterval(timer);timer=null;render();return;}if(!left)left=total;timer=setInterval(function(){left--;if(left<=0){left=0;clearInterval(timer);timer=null;}render();},1000);render();};render();})();</script>`;
  return injectBefore(injectBefore(upsertStyle(html, "progress", style), "</body>", body), "</body>", script);
}

function addCounterWidget(html: string): string {
  if (html.includes("data-local-counter")) return html;
  const style = `.local-counter{display:flex;align-items:center;justify-content:center;gap:12px;max-width:520px;margin:0 auto 18px;padding:14px;border:1px solid var(--border);border-radius:16px;background:var(--card)}.local-counter-output{min-width:74px;text-align:center;font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}`;
  const body = `<section class="local-counter" data-local-counter><button class="btn sec" type="button" data-local-counter-down aria-label="Decrease count">−</button><output class="local-counter-output" data-local-counter-output>0</output><button class="btn" type="button" data-local-counter-up aria-label="Increase count">+</button><button class="btn sec" type="button" data-local-counter-reset>Reset</button></section>`;
  const script = `<script data-local-agent="counter-script">(function(){var root=document.querySelector('[data-local-counter]');if(!root)return;var output=root.querySelector('[data-local-counter-output]');var key='mini-atoms:local-counter';var count=0;try{count=Number(localStorage.getItem(key)||0)||0;}catch(e){}function render(){output.textContent=String(count);try{localStorage.setItem(key,String(count));}catch(e){}}root.querySelector('[data-local-counter-down]').onclick=function(){count--;render();};root.querySelector('[data-local-counter-up]').onclick=function(){count++;render();};root.querySelector('[data-local-counter-reset]').onclick=function(){count=0;render();};render();})();</script>`;
  return injectBefore(injectBefore(upsertStyle(html, "counter", style), "</body>", body), "</body>", script);
}

function supportedCapabilities(): string {
  return "Supported local changes: theme/color, title, progress ring, and persistent counter.";
}

export function demoModify(prompt: string, currentHtml: string): DemoModifyResult {
  const p = prompt.toLowerCase();
  let html = currentHtml;
  const changes: string[] = [];

  const theme = THEMES.find((item) => item.match.test(p));
  if (theme) {
    html = applyTheme(html, theme);
    changes.push(`Applied ${theme.name}`);
  }

  const title = requestedTitle(prompt);
  if (title) {
    html = replaceTitle(html, title);
    changes.push(`Renamed the app to “${title}”`);
  }

  if (/progress|ring|circular|circle|进度|圆环|圆形/.test(p)) {
    const alreadyPresent = html.includes("data-local-progress");
    html = addProgressWidget(html);
    changes.push(alreadyPresent ? "Kept the existing progress ring" : "Added an interactive progress ring");
  }

  if (/counter|count(?:er)?|tally|计数|计数器/.test(p)) {
    const alreadyPresent = html.includes("data-local-counter");
    html = addCounterWidget(html);
    changes.push(alreadyPresent ? "Kept the existing counter" : "Added a persistent counter");
  }

  if (!changes.length) {
    return { html, summary: `No safe local transformation matched that request. ${supportedCapabilities()}` };
  }

  return { html, summary: `${changes.join(". ")}.` };
}
