// Offline demo engine. Used when DASHSCOPE_API_KEY is not configured so the
// full create -> preview -> modify -> persist loop is testable without a key.
// It returns a small library of hand-built, fully-functional self-contained
// apps chosen by keyword. Set a real key to replace this with the LLM.

interface ShellOpts {
  title: string;
  style: string;
  body: string;
  script: string;
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
.ring{font-size:60px;font-weight:800;font-variant-numeric:tabular-nums;margin:10px 0}
.mode{color:var(--muted);font-size:14px;margin-bottom:4px}
.row{display:flex;gap:8px;margin-top:14px}
.row input{flex:1}
ul{list-style:none;padding:0;margin:16px 0 0;text-align:left}
li{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
`,
    body: `
<div class="card center">
  <div class="mode" id="mode">Focus</div>
  <div class="ring" id="time">25:00</div>
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
  else { clearInterval(timer); running=false; mode = mode==='focus'?'break':'focus'; left=(mode==='focus'?25:5)*60; render(); }
}
document.getElementById('start').onclick=function(){ if(running) return; running=true; timer=setInterval(tick,1000); };
document.getElementById('pause').onclick=function(){ running=false; clearInterval(timer); };
document.getElementById('reset').onclick=function(){ running=false; clearInterval(timer); left=total; mode='focus'; render(); };
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
  <p class="sub">Demo mode generated a starter shell. Add a Qwen API key for a fully custom build.</p>
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
export function demoModify(prompt: string, currentHtml: string): DemoModifyResult {
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
      "Demo mode only supports basic changes (e.g. 'make it dark mode'). Add a Qwen API key for real AI edits.";
  } else {
    summary =
      "Demo mode: add DASHSCOPE_API_KEY to enable real AI modifications. The structure was kept intact.";
  }
  return { summary, html };
}
