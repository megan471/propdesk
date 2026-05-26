import { listenTo, setData, pushData, removeData, updateData } from "./firebase.js";

// ── USERS ────────────────────────────────────────────────────────────────────
const USERS = [
  { name: "Karen", pin: "1998", color: "#6366F1", icon: "👩‍💼" },
  { name: "Megan", pin: "1995", color: "#EC4899", icon: "👩‍💻" },
];

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUSES      = ["Current","Under Offer","Sold","Lost Lead"];
const STATUS_COLORS = { "Current":{ bg:"#3B82F6",light:"#EFF6FF" }, "Under Offer":{ bg:"#F59E0B",light:"#FFFBEB" }, "Sold":{ bg:"#10B981",light:"#ECFDF5" }, "Lost Lead":{ bg:"#EF4444",light:"#FEF2F2" } };
const ROLE_COLORS   = { Buyer:"#8B5CF6", Seller:"#F59E0B", Both:"#10B981" };
const PCOLS         = { High:"#EF4444", Medium:"#F59E0B", Low:"#10B981" };
const EVENT_COLORS  = { Viewing:"#3B82F6", "Show Day":"#F59E0B" };
const MONTHS        = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS          = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MANDATE_TYPES = ["Exclusive Mandate","Open Mandate","Shared Mandate","Other Mandate"];
const FIXED_DOCS    = ["Agreement","Lawyer Letter","Offer to Purchase","FICA Documents","Bond Application"];
const NAV           = [
  { key:"dashboard",  icon:"📊", label:"Dashboard"  },
  { key:"clients",    icon:"🏠", label:"Clients"    },
  { key:"contacts",   icon:"📋", label:"Contacts"   },
  { key:"commission", icon:"💰", label:"Commission" },
  { key:"tasks",      icon:"✅", label:"Tasks"      },
  { key:"calendar",   icon:"📅", label:"Calendar"   },
];

const fmt = n => "R " + Number(n).toLocaleString("en-ZA");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── STATE ────────────────────────────────────────────────────────────────────
let state = {
  user: null, tab: "dashboard",
  clients: {}, tasks: {}, commission: {}, events: {},
  loading: true,
};

// ── FIREBASE SYNC ────────────────────────────────────────────────────────────
function initListeners() {
  listenTo("clients",    v => { state.clients    = v || {}; render(); });
  listenTo("tasks",      v => { state.tasks      = v || {}; render(); });
  listenTo("commission", v => { state.commission = v || {}; render(); });
  listenTo("events",     v => { state.events     = v || {}; state.loading = false; render(); });
}

// ── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById("root");
  if (!state.user) { root.innerHTML = ""; root.appendChild(renderLogin()); return; }
  root.innerHTML = "";
  root.appendChild(renderApp());
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
let loginState = { selected: null, pin: "", error: "" };

function renderLogin() {
  const wrap = el("div", { style: pageStyle("linear-gradient(135deg,#1E1B4B,#4338CA,#7C3AED)","flex","center","center") });
  const card = el("div", { style: `background:#fff;border-radius:24px;padding:36px 28px;width:90%;max-width:360px;box-shadow:0 30px 80px rgba(0,0,0,0.3);text-align:center` });
  card.innerHTML = `<div style="font-size:36px">🏡</div><div style="font-weight:800;font-size:22px;color:#1E1B4B;margin:4px 0 2px">PropDesk</div><div style="font-size:12px;color:#94A3B8;margin-bottom:24px">Property Agent CRM</div>`;

  if (!loginState.selected) {
    const prompt = el("div", { style: "font-weight:600;color:#374151;margin-bottom:16px;font-size:14px" }, "Who's logging in?");
    const btns   = el("div", { style: "display:flex;gap:12px;justify-content:center" });
    USERS.forEach(u => {
      const b = el("button", { style: `background:${u.color};color:#fff;border:none;border-radius:14px;padding:18px 28px;cursor:pointer;font-weight:700;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:6px` });
      b.innerHTML = `<span style="font-size:28px">${u.icon}</span>${u.name}`;
      b.onclick = () => { loginState = { selected: u, pin: "", error: "" }; render(); };
      btns.appendChild(b);
    });
    card.appendChild(prompt); card.appendChild(btns);
  } else {
    const u = loginState.selected;
    const header = el("div", { style: "display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px" });
    header.innerHTML = `<span style="font-size:22px">${u.icon}</span><span style="font-weight:700;font-size:16px;color:#1E1B4B">Hi, ${u.name}!</span>`;
    const chg = el("button", { style: "background:none;border:none;color:#94A3B8;cursor:pointer;font-size:12px;margin-left:4px" }, "Change");
    chg.onclick = () => { loginState = { selected: null, pin: "", error: "" }; render(); };
    header.appendChild(chg);

    const prompt = el("div", { style: "font-weight:600;color:#374151;margin-bottom:16px;font-size:13px" }, "Enter your 4-digit PIN");
    const dots   = el("div", { style: "display:flex;gap:12px;justify-content:center;margin-bottom:20px" });
    for (let i = 0; i < 4; i++) {
      dots.appendChild(el("div", { style: `width:16px;height:16px;border-radius:50%;background:${i < loginState.pin.length ? u.color : "#E2E8F0"}` }));
    }
    const errDiv = el("div", { style: `color:#EF4444;font-size:12px;margin-bottom:12px;font-weight:600;min-height:18px` }, loginState.error);
    const grid   = el("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:220px;margin:0 auto" });
    [1,2,3,4,5,6,7,8,9,"",0,"⌫"].forEach(d => {
      const b = el("button", { style: `padding:14px 0;border-radius:12px;border:1.5px solid #E2E8F0;background:${d==="⌫"?"#FEF2F2":"#F8FAFC"};color:${d==="⌫"?"#EF4444":"#1E1B4B"};font-weight:700;font-size:18px;cursor:${d===""?"default":"pointer"};opacity:${d===""?0:1}` }, String(d));
      b.onclick = () => {
        if (d === "") return;
        if (d === "⌫") { loginState.pin = loginState.pin.slice(0,-1); loginState.error = ""; render(); return; }
        if (loginState.pin.length >= 4) return;
        loginState.pin += d;
        loginState.error = "";
        render();
        if (loginState.pin.length === 4) {
          setTimeout(() => {
            if (loginState.pin === loginState.selected.pin) { state.user = loginState.selected; loginState = { selected:null, pin:"", error:"" }; render(); }
            else { loginState.error = "Incorrect PIN. Try again."; loginState.pin = ""; render(); }
          }, 200);
        }
      };
      grid.appendChild(b);
    });
    card.appendChild(header); card.appendChild(prompt); card.appendChild(dots); card.appendChild(errDiv); card.appendChild(grid);
  }
  wrap.appendChild(card);
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════════
function renderApp() {
  const wrap = el("div", { style: "display:flex;flex-direction:column;min-height:100vh;font-family:'Segoe UI',sans-serif;background:#F1F5F9" });

  // Header
  const hdr = el("div", { style: "background:linear-gradient(90deg,#1E1B4B,#4338CA);color:#fff;padding:11px 16px;display:flex;align-items:center;justify-content:space-between" });
  hdr.innerHTML = `<div><span style="font-weight:800;font-size:17px">🏡 PropDesk</span><span style="font-size:11px;margin-left:8px;color:#A5B4FC">Property Agent CRM</span></div>`;
  const userBadge = el("div", { style: "display:flex;align-items:center;gap:8px" });
  const badge = el("div", { style: "display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border-radius:20px;padding:5px 12px" });
  badge.innerHTML = `<span style="font-size:14px">${state.user.icon}</span><span style="font-size:12px;font-weight:600">${state.user.name}</span>`;
  const lockBtn = el("button", { style: "background:none;border:none;color:#A5B4FC;cursor:pointer;font-size:11px;margin-left:4px" }, "🔒 Lock");
  lockBtn.onclick = () => { state.user = null; render(); };
  badge.appendChild(lockBtn); userBadge.appendChild(badge); hdr.appendChild(userBadge);

  // Nav
  const nav = el("div", { style: "background:#fff;border-bottom:2px solid #E2E8F0;display:flex;overflow-x:auto" });
  NAV.forEach(n => {
    const b = el("button", { style: `padding:11px 13px;border:none;background:none;cursor:pointer;font-weight:600;font-size:12px;white-space:nowrap;color:${state.tab===n.key?"#4338CA":"#64748B"};border-bottom:${state.tab===n.key?"3px solid #4338CA":"3px solid transparent"}` }, `${n.icon} ${n.label}`);
    b.onclick = () => { state.tab = n.key; render(); };
    nav.appendChild(b);
  });

  // Content
  const content = el("div", { style: "flex:1;overflow-y:auto;padding:16px" });
  if (state.loading) { content.innerHTML = `<div style="text-align:center;padding:60px;color:#94A3B8;font-size:14px">Loading data... ⏳</div>`; }
  else {
    const clients    = Object.entries(state.clients   ).map(([id,v])=>({...v,id}));
    const tasks      = Object.entries(state.tasks     ).map(([id,v])=>({...v,id}));
    const commission = Object.entries(state.commission).map(([id,v])=>({...v,id}));
    const events     = Object.entries(state.events    ).map(([id,v])=>({...v,id}));
    if (state.tab==="dashboard")  content.appendChild(renderDashboard(clients,tasks,commission,events));
    if (state.tab==="clients")    content.appendChild(renderClients(clients));
    if (state.tab==="contacts")   content.appendChild(renderContacts(clients));
    if (state.tab==="commission") content.appendChild(renderCommission(commission));
    if (state.tab==="tasks")      content.appendChild(renderTasks(tasks));
    if (state.tab==="calendar")   content.appendChild(renderCalendar(events,clients));
  }

  wrap.appendChild(hdr); wrap.appendChild(nav); wrap.appendChild(content);
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function renderDashboard(clients, tasks, commission, events) {
  const wrap = el("div", { style: "display:flex;flex-direction:column;gap:14px" });
  const sold = clients.filter(c=>c.status==="Sold"), uo=clients.filter(c=>c.status==="Under Offer"), cur=clients.filter(c=>c.status==="Current"), lost=clients.filter(c=>c.status==="Lost Lead");
  const calc = (c) => { const g=c.salePrice*c.commPct/100,v=g*0.15,n=g-v; return n*c.splitPct/100; };
  const totNet = commission.reduce((a,c)=>{const g=c.salePrice*c.commPct/100;return a+(g-g*0.15);},0);
  const paidNet= commission.filter(c=>c.paid).reduce((a,c)=>{const g=c.salePrice*c.commPct/100;return a+(g-g*0.15);},0);

  // Stat cards
  const cards = el("div", { style: "display:flex;gap:10px;flex-wrap:wrap" });
  [["🏠","Active",cur.length,"#3B82F6","#EFF6FF"],["🤝","Under Offer",uo.length,"#F59E0B","#FFFBEB"],["✅","Sold",sold.length,"#10B981","#ECFDF5"],["📉","Lost",lost.length,"#EF4444","#FEF2F2"]].forEach(([icon,label,val,color,bg])=>{
    const c = el("div",{style:`background:${bg};border-radius:12px;padding:14px 16px;border-left:4px solid ${color};flex:1;min-width:100px`});
    c.innerHTML=`<div style="font-size:20px">${icon}</div><div style="font-size:26px;font-weight:800;color:${color}">${val}</div><div style="font-size:11px;color:#64748B">${label}</div>`;
    cards.appendChild(c);
  });

  // Comm summary
  const commBox = el("div",{style:"background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06)"});
  commBox.innerHTML=`<div style="font-weight:700;color:#1E1B4B;margin-bottom:10px;font-size:14px">💰 Commission Summary</div>`;
  [["Net to Agency",totNet,"#10B981"],["Net Received",paidNet,"#10B981"],["Net Pending",totNet-paidNet,"#F59E0B"]].forEach(([l,v,c])=>{
    const r=el("div",{style:"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F8FAFC;font-size:13px"});
    r.innerHTML=`<span style="color:#64748B">${l}</span><span style="font-weight:700;color:${c}">${fmt(v)}</span>`;
    commBox.appendChild(r);
  });

  // Pending tasks
  const pending = tasks.filter(t=>!t.done);
  const taskBox = el("div",{style:"background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06)"});
  taskBox.innerHTML=`<div style="font-weight:700;color:#1E1B4B;margin-bottom:10px;font-size:14px">✅ Pending Tasks (${pending.length})</div>`;
  if (!pending.length) taskBox.innerHTML += `<div style="color:#94A3B8;font-size:12px">All caught up! 🎉</div>`;
  pending.slice(0,4).forEach(t=>{
    const r=el("div",{style:"display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid #F8FAFC"});
    r.innerHTML=`<div style="width:7px;height:7px;border-radius:50%;background:${PCOLS[t.priority]};flex-shrink:0"></div><span style="font-size:12px;color:#374151">${t.title}</span>`;
    taskBox.appendChild(r);
  });

  // Upcoming events
  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = events.filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
  const evBox = el("div",{style:"background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06)"});
  evBox.innerHTML=`<div style="font-weight:700;color:#1E1B4B;margin-bottom:10px;font-size:14px">📅 Upcoming (${upcoming.length})</div>`;
  if (!upcoming.length) evBox.innerHTML+=`<div style="color:#94A3B8;font-size:12px">No upcoming events.</div>`;
  upcoming.forEach(e=>{
    const r=el("div",{style:"padding:5px 0;border-bottom:1px solid #F8FAFC"});
    r.innerHTML=`<div style="display:flex;align-items:center;gap:5px"><span style="background:${EVENT_COLORS[e.type]};color:#fff;font-size:9px;padding:1px 6px;border-radius:10px;font-weight:700">${e.type}</span><span style="font-size:11px;color:#64748B">${e.date} ${e.time}</span></div><div style="font-size:12px;font-weight:600;color:#1E1B4B;margin-top:2px">${e.address}</div>`;
    evBox.appendChild(r);
  });

  const row = el("div",{style:"display:flex;gap:12px;flex-wrap:wrap"});
  row.appendChild(taskBox); row.appendChild(evBox);
  wrap.appendChild(cards); wrap.appendChild(commBox); wrap.appendChild(row);
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════════════════════════════
let clientState = { roleTab:"All", statusTab:"All", showModal:false, editId:null, viewId:null,
  form:{ name:"",cell:"",email:"",address:"",price:"",status:"Current",role:"Buyer",notes:"" } };

function renderClients(clients) {
  const wrap = el("div");

  // Role tabs
  const roleTabs = el("div",{style:"display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap"});
  ["All","Buyer","Seller"].forEach(r=>{
    const active = clientState.roleTab===r;
    const b=el("button",{style:`padding:6px 14px;border-radius:20px;border:none;cursor:pointer;font-weight:600;font-size:11px;background:${active?(ROLE_COLORS[r]||"#4338CA"):"#E2E8F0"};color:${active?"#fff":"#64748B"}`},`${r==="Buyer"?"🛒":r==="Seller"?"🏷️":"👥"} ${r}`);
    b.onclick=()=>{ clientState.roleTab=r; render(); };
    roleTabs.appendChild(b);
  });

  // Status filter
  const statusRow = el("div",{style:"display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center"});
  ["All",...STATUSES].forEach(s=>{
    const active=clientState.statusTab===s;
    const b=el("button",{style:`padding:5px 11px;border-radius:20px;border:none;cursor:pointer;font-weight:600;font-size:11px;background:${active?(STATUS_COLORS[s]?.bg||"#4338CA"):"#E2E8F0"};color:${active?"#fff":"#64748B"}`},s);
    b.onclick=()=>{ clientState.statusTab=s; render(); };
    statusRow.appendChild(b);
  });
  const addBtn=el("button",{style:btnStyle("#6366F1")+";margin-left:auto"},"+ Add Client");
  addBtn.onclick=()=>{ clientState.showModal=true; clientState.editId=null; clientState.form={name:"",cell:"",email:"",address:"",price:"",status:"Current",role:"Buyer",notes:""}; render(); };
  statusRow.appendChild(addBtn);

  // Filter
  const filtered = clients.filter(c=>
    (clientState.roleTab==="All"||c.role===clientState.roleTab||c.role==="Both")&&
    (clientState.statusTab==="All"||c.status===clientState.statusTab)
  );

  const list=el("div",{style:"display:flex;flex-direction:column;gap:10px"});
  if (!filtered.length) list.appendChild(emptyEl("No clients match this filter."));
  filtered.forEach(c=>{
    const card=el("div",{style:`background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,0.06);border-left:4px solid ${STATUS_COLORS[c.status].bg}`});
    card.innerHTML=`
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px">
        <div style="font-weight:700;font-size:14px;color:#1E1B4B">${c.name}</div>
        <div style="display:flex;gap:5px">
          <span style="background:${ROLE_COLORS[c.role]}22;color:${ROLE_COLORS[c.role]};font-size:9px;padding:2px 8px;border-radius:20px;font-weight:700">${c.role==="Both"?"🛒🏷️ Buyer & Seller":c.role==="Buyer"?"🛒 Buyer":"🏷️ Seller"}</span>
          <span style="background:${STATUS_COLORS[c.status].bg};color:#fff;font-size:9px;padding:2px 8px;border-radius:20px;font-weight:700">${c.status}</span>
        </div>
      </div>
      <div style="font-size:12px;color:#64748B;margin-top:2px">📍 ${c.address}</div>
      <div style="font-weight:800;color:#10B981;margin-top:3px;font-size:13px">${fmt(c.price)}</div>
      <div style="margin-top:5px;font-size:12px;color:#374151">📱 ${c.cell} &nbsp;|&nbsp; ✉️ ${c.email}</div>
      ${c.notes?`<div style="background:#F8FAFC;border-radius:6px;padding:4px 8px;margin-top:6px;font-size:11px;color:#64748B">📝 ${c.notes}</div>`:""}
    `;
    const btnsRow=el("div",{style:"display:flex;gap:6px;margin-top:10px"});
    const docsBtn=el("button",{style:sBtnStyle("#6366F1")},"📁 Docs");
    docsBtn.onclick=()=>{ clientState.viewId=c.id; render(); };
    const editBtn=el("button",{style:sBtnStyle("#F59E0B")},"✏️ Edit");
    editBtn.onclick=()=>{ clientState.editId=c.id; clientState.form={...c}; clientState.showModal=true; render(); };
    const delBtn=el("button",{style:sBtnStyle("#EF4444")},"🗑 Delete");
    delBtn.onclick=()=>{ if(confirm(`Delete ${c.name}?`)) removeData(`clients/${c.id}`); };
    btnsRow.appendChild(docsBtn); btnsRow.appendChild(editBtn); btnsRow.appendChild(delBtn);
    card.appendChild(btnsRow); list.appendChild(card);
  });

  wrap.appendChild(roleTabs); wrap.appendChild(statusRow); wrap.appendChild(list);

  // Add/Edit Modal
  if (clientState.showModal) {
    const f = clientState.form;
    const m = modal(clientState.editId?"Edit Client":"Add Client", ()=>{ clientState.showModal=false; render(); });
    [["Full Name","name","text"],["Cell Number","cell","text"],["Email","email","email"],["Property Address","address","text"],["Price (R)","price","number"]].forEach(([l,k,t])=>{
      m.body.appendChild(field(l, inputEl(t, f[k]||"", v=>{ clientState.form[k]=v; })));
    });
    m.body.appendChild(field("Role", selectEl(["Buyer","Seller","Both"], f.role, v=>{ clientState.form.role=v; })));
    m.body.appendChild(field("Status", selectEl(STATUSES, f.status, v=>{ clientState.form.status=v; })));
    m.body.appendChild(field("Notes", textareaEl(f.notes||"", v=>{ clientState.form.notes=v; })));
    const saveBtn=el("button",{style:btnStyle("#6366F1")},"Save Client");
    saveBtn.onclick=()=>{
      if (!clientState.form.name) return;
      const data={...clientState.form,price:Number(clientState.form.price),docs:clientState.form.docs||{},mandates:clientState.form.mandates||[],customDocs:clientState.form.customDocs||[]};
      if (clientState.editId) updateData(`clients/${clientState.editId}`, data);
      else { const id=uid(); setData(`clients/${id}`, {...data,id}); }
      clientState.showModal=false; render();
    };
    m.body.appendChild(saveBtn); wrap.appendChild(m.overlay);
  }

  // Docs Modal
  if (clientState.viewId) {
    const c = clients.find(x=>x.id===clientState.viewId);
    if (c) {
      const m = modal(`📁 ${c.name} — Documents`, ()=>{ clientState.viewId=null; render(); });
      m.body.innerHTML+=`<div style="font-size:12px;color:#64748B;margin-bottom:12px">Upload and manage all documents for this client.</div>`;

      // Fixed docs
      const fh=el("div",{style:"font-weight:700;font-size:12px;color:#374151;margin-bottom:6px"},"📋 Standard Documents");
      m.body.appendChild(fh);
      FIXED_DOCS.forEach(dt=>{
        const doc=(c.docs||{})[dt];
        const row=el("div",{style:`background:${doc?"#ECFDF5":"#F8FAFC"};border-radius:9px;padding:9px 12px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center`});
        row.innerHTML=`<div><div style="font-weight:600;font-size:12px">📄 ${dt}</div><div style="font-size:10px;color:${doc?"#10B981":"#94A3B8"};margin-top:1px">${doc?`✅ ${doc}`:"No file uploaded"}</div></div>`;
        const inp=document.createElement("input"); inp.type="file"; inp.accept=".pdf"; inp.style.display="none";
        inp.onchange=e=>{ const f=e.target.files[0]; if(f) updateData(`clients/${c.id}/docs`,{...(c.docs||{}),[dt]:f.name}); };
        const ub=el("button",{style:sBtnStyle(doc?"#10B981":"#6366F1")},doc?"Replace":"Upload");
        ub.onclick=()=>inp.click();
        row.appendChild(inp); row.appendChild(ub); m.body.appendChild(row);
      });

      // Mandates
      const mh=el("div",{style:"font-weight:700;font-size:12px;color:#374151;margin:14px 0 6px"},"📑 Mandates");
      m.body.appendChild(mh);
      (c.mandates||[]).forEach((man,i)=>{
        const row=el("div",{style:"background:#ECFDF5;border-radius:9px;padding:8px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center"});
        row.innerHTML=`<div><div style="font-weight:600;font-size:12px">📑 ${man.label}</div><div style="font-size:10px;color:#10B981">✅ ${man.fileName}</div></div>`;
        const rb=el("button",{style:sBtnStyle("#EF4444")},"Remove");
        rb.onclick=()=>{ const updated=[...(c.mandates||[])]; updated.splice(i,1); updateData(`clients/${c.id}`,{...c,mandates:updated}); };
        row.appendChild(rb); m.body.appendChild(row);
      });
      // Add mandate
      const mandateBox=el("div",{style:"background:#F8FAFC;border-radius:9px;padding:10px 12px;margin-bottom:6px"});
      mandateBox.innerHTML=`<div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px">Add Mandate</div>`;
      let selType=MANDATE_TYPES[0], customLabel="";
      const typeSelect=selectEl(MANDATE_TYPES, selType, v=>{ selType=v; if(v!=="Other Mandate") customInput.style.display="none"; else customInput.style.display="block"; });
      const customInput=inputEl("text","",v=>{ customLabel=v; }); customInput.placeholder="Custom mandate label..."; customInput.style.display="none"; customInput.style.marginBottom="6px";
      const mFile=document.createElement("input"); mFile.type="file"; mFile.accept=".pdf"; mFile.style.display="none";
      mFile.onchange=e=>{ const f=e.target.files[0]; if(!f) return; const label=selType==="Other Mandate"?(customLabel||"Other Mandate"):selType; const updated=[...(c.mandates||[]),{label,fileName:f.name}]; updateData(`clients/${c.id}`,{...c,mandates:updated}); };
      const mBtn=el("button",{style:btnStyle("#6366F1")},"📎 Upload Mandate PDF"); mBtn.onclick=()=>mFile.click();
      mandateBox.appendChild(typeSelect); mandateBox.appendChild(customInput); mandateBox.appendChild(mFile); mandateBox.appendChild(mBtn);
      m.body.appendChild(mandateBox);

      // Custom docs
      const ch=el("div",{style:"font-weight:700;font-size:12px;color:#374151;margin:14px 0 6px"},"📎 Other Documents");
      m.body.appendChild(ch);
      (c.customDocs||[]).forEach((d,i)=>{
        const row=el("div",{style:"background:#EFF6FF;border-radius:9px;padding:8px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center"});
        row.innerHTML=`<div><div style="font-weight:600;font-size:12px">📎 ${d.label}</div><div style="font-size:10px;color:#3B82F6">✅ ${d.fileName}</div></div>`;
        const rb=el("button",{style:sBtnStyle("#EF4444")},"Remove");
        rb.onclick=()=>{ const updated=[...(c.customDocs||[])]; updated.splice(i,1); updateData(`clients/${c.id}`,{...c,customDocs:updated}); };
        row.appendChild(rb); m.body.appendChild(row);
      });
      const customBox=el("div",{style:"background:#F8FAFC;border-radius:9px;padding:10px 12px"});
      customBox.innerHTML=`<div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px">Add Custom Document</div>`;
      let customDocLabel="";
      const cdInput=inputEl("text","",v=>{ customDocLabel=v; }); cdInput.placeholder="Document name (e.g. Transfer Docs)..."; cdInput.style.marginBottom="6px";
      const cdFile=document.createElement("input"); cdFile.type="file"; cdFile.accept=".pdf"; cdFile.style.display="none";
      cdFile.onchange=e=>{ const f=e.target.files[0]; if(!f||!customDocLabel.trim()) return; const updated=[...(c.customDocs||[]),{label:customDocLabel,fileName:f.name}]; updateData(`clients/${c.id}`,{...c,customDocs:updated}); customDocLabel=""; };
      const cdBtn=el("button",{style:btnStyle("#6366F1")},"📎 Upload PDF"); cdBtn.onclick=()=>{ if(customDocLabel.trim()) cdFile.click(); else alert("Enter a document name first."); };
      customBox.appendChild(cdInput); customBox.appendChild(cdFile); customBox.appendChild(cdBtn);
      m.body.appendChild(customBox);
      wrap.appendChild(m.overlay);
    }
  }
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTACTS
// ══════════════════════════════════════════════════════════════════════════════
let contactSearch = "";
function renderContacts(clients) {
  const wrap=el("div");
  const srch=inputEl("text", contactSearch, v=>{ contactSearch=v; renderContactsList(list, clients); });
  srch.placeholder="🔍 Search name, email or cell..."; srch.style.marginBottom="14px"; srch.style.width="100%";
  const list=el("div",{style:"display:flex;flex-direction:column;gap:8px"});
  renderContactsList(list, clients);
  wrap.appendChild(srch); wrap.appendChild(list);
  return wrap;
}
function renderContactsList(list, clients) {
  list.innerHTML="";
  const filtered=clients.filter(c=>c.name.toLowerCase().includes(contactSearch.toLowerCase())||c.email.toLowerCase().includes(contactSearch.toLowerCase())||c.cell.includes(contactSearch));
  if (!filtered.length) { list.appendChild(emptyEl("No contacts found.")); return; }
  filtered.forEach(c=>{
    const row=el("div",{style:"background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"});
    row.innerHTML=`<div><div style="font-weight:700;font-size:13px;color:#1E1B4B">${c.name}</div><div style="font-size:12px;color:#64748B">📱 ${c.cell} &nbsp;|&nbsp; ✉️ ${c.email}</div><div style="font-size:11px;color:#94A3B8">📍 ${c.address}</div></div><div style="display:flex;gap:5px"><span style="background:${ROLE_COLORS[c.role]}22;color:${ROLE_COLORS[c.role]};font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700">${c.role}</span><span style="background:${STATUS_COLORS[c.status].bg};color:#fff;font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700">${c.status}</span></div>`;
    list.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMISSION
// ══════════════════════════════════════════════════════════════════════════════
let commState = { tab:"Pending", showModal:false, form:{ property:"",salePrice:"",commPct:"5.5",splitPct:"60",paid:false } };
function calcComm(sp,cp,st){ const g=sp*cp/100,v=g*0.15,n=g-v; return {gross:g,vat:v,net:n,agentNet:n*st/100}; }
function renderCommission(commission) {
  const wrap=el("div");
  const totGross=commission.reduce((a,c)=>a+c.salePrice*c.commPct/100,0);
  const totVAT=totGross*0.15, totNet=totGross-totVAT;
  const totAgent=commission.reduce((a,c)=>{ const {net}=calcComm(c.salePrice,c.commPct,c.splitPct); return a+net*c.splitPct/100; },0);
  const paidAgent=commission.filter(c=>c.paid).reduce((a,c)=>{ const {net}=calcComm(c.salePrice,c.commPct,c.splitPct); return a+net*c.splitPct/100; },0);

  // Summary cards
  const cards=el("div",{style:"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"});
  [["Gross",totGross,"#6366F1"],["VAT to SARS",totVAT,"#EF4444"],["Net Agency",totNet,"#3B82F6"],["Your Share",totAgent,"#10B981"],["Pending",totAgent-paidAgent,"#F59E0B"]].forEach(([l,v,c])=>{
    const d=el("div",{style:`background:#fff;border-radius:10px;padding:10px 12px;border-left:4px solid ${c};flex:1;min-width:85px;box-shadow:0 1px 4px rgba(0,0,0,0.06)`});
    d.innerHTML=`<div style="font-size:10px;color:#64748B;font-weight:600">${l}</div><div style="font-size:13px;font-weight:800;color:${c};margin-top:2px">${fmt(v)}</div>`;
    cards.appendChild(d);
  });

  // Tabs
  const tabRow=el("div",{style:"display:flex;gap:6px;margin-bottom:14px;align-items:center"});
  ["Pending","Paid"].forEach(t=>{
    const active=commState.tab===t;
    const b=el("button",{style:`padding:7px 18px;border-radius:20px;border:none;cursor:pointer;font-weight:600;font-size:12px;background:${active?(t==="Paid"?"#10B981":"#F59E0B"):"#E2E8F0"};color:${active?"#fff":"#64748B"}`},`${t==="Paid"?"✅":"⏳"} ${t} (${commission.filter(c=>t==="Paid"?c.paid:!c.paid).length})`);
    b.onclick=()=>{ commState.tab=t; render(); };
    tabRow.appendChild(b);
  });
  const addBtn=el("button",{style:btnStyle("#10B981")+";margin-left:auto"},"+ Add Sale");
  addBtn.onclick=()=>{ commState.showModal=true; commState.form={property:"",salePrice:"",commPct:"5.5",splitPct:"60",paid:false}; render(); };
  tabRow.appendChild(addBtn);

  const filtered=commission.filter(c=>commState.tab==="Paid"?c.paid:!c.paid);
  const list=el("div",{style:"display:flex;flex-direction:column;gap:8px"});
  if (!filtered.length) list.appendChild(emptyEl(`No ${commState.tab.toLowerCase()} commission entries yet.`));
  filtered.forEach(c=>{
    const {gross,vat,net,agentNet}=calcComm(c.salePrice,c.commPct,c.splitPct);
    const card=el("div",{style:`background:#fff;border-radius:12px;padding:13px 15px;box-shadow:0 1px 5px rgba(0,0,0,0.06);border-left:4px solid ${c.paid?"#10B981":"#F59E0B"}`});
    card.innerHTML=`<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px"><div><div style="font-weight:700;font-size:13px;color:#1E1B4B">${c.property}</div><div style="font-size:11px;color:#64748B">Sale: ${fmt(c.salePrice)} @ ${c.commPct}% | Split: ${c.splitPct}%</div></div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px">${[["Gross",gross,"#6366F1"],["VAT",vat,"#EF4444"],["Net Agency",net,"#3B82F6"],["Your Share",agentNet,"#10B981"]].map(([l,v,col])=>`<div style="background:#F8FAFC;border-radius:7px;padding:6px 8px"><div style="font-size:9px;color:#94A3B8;font-weight:600">${l}</div><div style="font-size:11px;font-weight:800;color:${col}">${fmt(v)}</div></div>`).join("")}</div>`;
    const toggleBtn=el("button",{style:sBtnStyle(c.paid?"#F59E0B":"#10B981")+";margin-top:8px;margin-right:6px"},c.paid?"⏳ Mark Pending":"✅ Mark Paid");
    toggleBtn.onclick=()=>updateData(`commission/${c.id}`,{...c,paid:!c.paid});
    const delBtn=el("button",{style:sBtnStyle("#EF4444")+";margin-top:8px"},"Remove");
    delBtn.onclick=()=>{ if(confirm("Remove this entry?")) removeData(`commission/${c.id}`); };
    card.appendChild(toggleBtn); card.appendChild(delBtn); list.appendChild(card);
  });

  wrap.appendChild(cards); wrap.appendChild(tabRow); wrap.appendChild(list);

  // Modal
  if (commState.showModal) {
    const f=commState.form;
    const m=modal("Add Sale & Commission",()=>{ commState.showModal=false; render(); });
    [["Property Address","property","text"],["Sale Price (R)","salePrice","number"],["Commission %","commPct","number"],["Your Split %","splitPct","number"]].forEach(([l,k,t])=>{
      m.body.appendChild(field(l, inputEl(t, f[k], v=>{ commState.form[k]=v; updatePreview(); })));
    });
    const preview=el("div",{style:"background:#F0FDF4;border-radius:10px;padding:12px 14px;margin-bottom:12px;display:none"});
    function updatePreview(){ if(!f.salePrice||!f.commPct) return; const {gross,vat,net,agentNet}=calcComm(Number(f.salePrice),Number(f.commPct),Number(f.splitPct)); preview.style.display="block"; preview.innerHTML=`<div style="font-weight:700;font-size:12px;color:#065F46;margin-bottom:8px">💰 Breakdown</div>${[["Gross Commission",gross,"#6366F1"],["VAT (15% to SARS)",vat,"#EF4444"],["Net to Agency",net,"#3B82F6"],["Your Share ("+f.splitPct+"%)",agentNet,"#10B981"]].map(([l,v,c])=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #D1FAE5"><span style="color:#374151">${l}</span><span style="font-weight:700;color:${c}">${fmt(v)}</span></div>`).join("")}`; }
    m.body.appendChild(preview);
    const paidRow=el("div",{style:"display:flex;align-items:center;gap:8px;margin-bottom:14px"});
    const paidChk=document.createElement("input"); paidChk.type="checkbox"; paidChk.checked=f.paid; paidChk.onchange=e=>{ commState.form.paid=e.target.checked; };
    const paidLbl=el("label",{style:"font-size:13px"},"Mark as Paid");
    paidRow.appendChild(paidChk); paidRow.appendChild(paidLbl); m.body.appendChild(paidRow);
    const saveBtn=el("button",{style:btnStyle("#10B981")},"Save Sale");
    saveBtn.onclick=()=>{ if(!f.property||!f.salePrice) return; const id=uid(); setData(`commission/${id}`,{...f,id,salePrice:Number(f.salePrice),commPct:Number(f.commPct),splitPct:Number(f.splitPct)}); commState.showModal=false; render(); };
    m.body.appendChild(saveBtn); wrap.appendChild(m.overlay);
  }
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════════════════════
let taskState = { filter:"Pending", showAdd:false, form:{ title:"",date:"",priority:"Medium" } };
function renderTasks(tasks) {
  const wrap=el("div");
  const counts={ All:tasks.length, Pending:tasks.filter(t=>!t.done).length, Completed:tasks.filter(t=>t.done).length };
  const tabRow=el("div",{style:"display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center"});
  ["Pending","All","Completed"].forEach(f=>{
    const b=el("button",{style:`padding:6px 14px;border-radius:20px;border:none;cursor:pointer;font-weight:600;font-size:12px;background:${taskState.filter===f?"#F59E0B":"#E2E8F0"};color:${taskState.filter===f?"#fff":"#64748B"}`},`${f} (${counts[f]})`);
    b.onclick=()=>{ taskState.filter=f; render(); };
    tabRow.appendChild(b);
  });
  const addBtn=el("button",{style:btnStyle("#6366F1")+";margin-left:auto"},taskState.showAdd?"Cancel":"+ Add Task");
  addBtn.onclick=()=>{ taskState.showAdd=!taskState.showAdd; render(); };
  tabRow.appendChild(addBtn);

  if (taskState.showAdd) {
    const box=el("div",{style:"background:#fff;border-radius:12px;padding:14px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,0.08)"});
    box.appendChild(field("Task Description", inputEl("text", taskState.form.title, v=>{ taskState.form.title=v; })));
    const row2=el("div",{style:"display:flex;gap:8px;margin-bottom:10px"});
    row2.appendChild(el("div",{style:"flex:1"})); row2.children[0].appendChild(field("Due Date", inputEl("date", taskState.form.date, v=>{ taskState.form.date=v; })));
    row2.appendChild(el("div",{style:"flex:1"})); row2.children[1].appendChild(field("Priority", selectEl(["High","Medium","Low"], taskState.form.priority, v=>{ taskState.form.priority=v; })));
    box.appendChild(row2);
    const saveBtn=el("button",{style:btnStyle("#6366F1")},"Add Task");
    saveBtn.onclick=()=>{ if(!taskState.form.title.trim()) return; const id=uid(); setData(`tasks/${id}`,{...taskState.form,id,done:false}); taskState.showAdd=false; taskState.form={title:"",date:"",priority:"Medium"}; render(); };
    box.appendChild(saveBtn); wrap.appendChild(tabRow); wrap.appendChild(box);
  } else { wrap.appendChild(tabRow); }

  const filtered=tasks.filter(t=>taskState.filter==="All"?true:taskState.filter==="Completed"?t.done:!t.done);
  const list=el("div",{style:"display:flex;flex-direction:column;gap:8px"});
  if (!filtered.length) list.appendChild(emptyEl(taskState.filter==="Completed"?"No completed tasks yet.":"Nothing pending — all caught up! 🎉"));
  filtered.forEach(t=>{
    const row=el("div",{style:`background:#fff;border-radius:10px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid ${PCOLS[t.priority]};opacity:${t.done?0.6:1}`});
    const chk=document.createElement("input"); chk.type="checkbox"; chk.checked=t.done; chk.style.cssText="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:#6366F1";
    chk.onchange=()=>updateData(`tasks/${t.id}`,{...t,done:!t.done});
    const info=el("div",{style:"flex:1"});
    info.innerHTML=`<div style="font-weight:600;font-size:13px;color:#1E1B4B;text-decoration:${t.done?"line-through":"none"}">${t.title}</div><div style="display:flex;gap:8px;margin-top:4px;align-items:center"><span style="background:${PCOLS[t.priority]}22;color:${PCOLS[t.priority]};font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px">${t.priority}</span>${t.date?`<span style="font-size:11px;color:#94A3B8">📅 ${t.date}</span>`:""}</div>`;
    const delBtn=el("button",{style:"background:none;border:none;color:#CBD5E1;cursor:pointer;font-size:15px;padding:0"},"✕");
    delBtn.onclick=()=>removeData(`tasks/${t.id}`);
    row.appendChild(chk); row.appendChild(info); row.appendChild(delBtn); list.appendChild(row);
  });
  wrap.appendChild(list);
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════════════════════════════════════
const today=new Date();
let calState={ year:today.getFullYear(), month:today.getMonth(), showModal:false, editId:null, form:{date:"",time:"09:00",type:"Viewing",address:"",client:"",notes:""} };

function renderCalendar(events, clients) {
  const wrap=el("div");
  const firstDay=new Date(calState.year,calState.month,1).getDay();
  const daysInMonth=new Date(calState.year,calState.month+1,0).getDate();
  const todayStr=new Date().toISOString().split("T")[0];

  // Calendar box
  const calBox=el("div",{style:"background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,0.06);margin-bottom:14px"});
  const hdr=el("div",{style:"display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"});
  const prev=el("button",{style:sBtnStyle("#6366F1")},"‹ Prev"); prev.onclick=()=>{ if(calState.month===0){calState.month=11;calState.year--;}else calState.month--; render(); };
  const next=el("button",{style:sBtnStyle("#6366F1")},"Next ›"); next.onclick=()=>{ if(calState.month===11){calState.month=0;calState.year++;}else calState.month++; render(); };
  hdr.appendChild(prev); hdr.appendChild(el("div",{style:"font-weight:800;font-size:15px;color:#1E1B4B"},`${MONTHS[calState.month]} ${calState.year}`)); hdr.appendChild(next);
  calBox.appendChild(hdr);

  const dayHdr=el("div",{style:"display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px"});
  DAYS.forEach(d=>dayHdr.appendChild(el("div",{style:"text-align:center;font-size:10px;font-weight:700;color:#94A3B8"},d)));
  calBox.appendChild(dayHdr);

  const grid=el("div",{style:"display:grid;grid-template-columns:repeat(7,1fr);gap:2px"});
  for(let i=0;i<firstDay;i++) grid.appendChild(el("div"));
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${calState.year}-${String(calState.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dayEvs=events.filter(e=>e.date===ds);
    const isToday=ds===todayStr;
    const cell=el("div",{style:`min-height:42px;border-radius:6px;padding:3px 2px;cursor:pointer;background:${isToday?"#EEF2FF":"#FAFBFC"};border:${isToday?"2px solid #6366F1":"1px solid #F1F5F9"}`});
    cell.innerHTML=`<div style="font-size:10px;font-weight:${isToday?800:500};color:${isToday?"#4338CA":"#374151"};text-align:center">${d}</div>`;
    dayEvs.slice(0,2).forEach(e=>{
      const ev=el("div",{style:`background:${EVENT_COLORS[e.type]};color:#fff;font-size:7px;border-radius:3px;padding:1px 2px;margin-top:1px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:600;cursor:pointer`},`${e.time} ${e.type}`);
      ev.onclick=ev2=>{ ev2.stopPropagation(); calState.editId=e.id; calState.form={...e}; calState.showModal=true; render(); };
      cell.appendChild(ev);
    });
    if(dayEvs.length>2) cell.appendChild(el("div",{style:"font-size:8px;color:#94A3B8;text-align:center"},`+${dayEvs.length-2}`));
    cell.onclick=()=>{ calState.form={date:ds,time:"09:00",type:"Viewing",address:"",client:"",notes:""}; calState.editId=null; calState.showModal=true; render(); };
    grid.appendChild(cell);
  }
  calBox.appendChild(grid);

  // Legend + add
  const legend=el("div",{style:"display:flex;gap:10px;margin-bottom:14px;align-items:center"});
  Object.entries(EVENT_COLORS).forEach(([t,c])=>{ const d=el("div",{style:"display:flex;align-items:center;gap:5px;font-size:12px"}); d.innerHTML=`<div style="width:10px;height:10px;border-radius:2px;background:${c}"></div><span style="color:#64748B">${t}</span>`; legend.appendChild(d); });
  const addEvBtn=el("button",{style:btnStyle("#6366F1")+";margin-left:auto;font-size:12px;padding:6px 12px"},"+ Add Event");
  addEvBtn.onclick=()=>{ calState.form={date:"",time:"09:00",type:"Viewing",address:"",client:"",notes:""}; calState.editId=null; calState.showModal=true; render(); };
  legend.appendChild(addEvBtn);

  // Upcoming
  const upBox=el("div",{style:"background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06)"});
  const upcoming=events.filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date));
  upBox.innerHTML=`<div style="font-weight:700;color:#1E1B4B;margin-bottom:10px;font-size:14px">📋 Upcoming Events</div>`;
  if(!upcoming.length) upBox.appendChild(emptyEl("No upcoming events."));
  upcoming.forEach(e=>{
    const row=el("div",{style:`border-left:4px solid ${EVENT_COLORS[e.type]};background:#F8FAFC;border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start`});
    row.innerHTML=`<div><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><span style="background:${EVENT_COLORS[e.type]};color:#fff;font-size:9px;padding:1px 7px;border-radius:10px;font-weight:700">${e.type}</span><span style="font-size:11px;color:#64748B">${e.date} @ ${e.time}</span></div><div style="font-weight:700;font-size:13px;color:#1E1B4B">${e.address}</div>${e.client?`<div style="font-size:11px;color:#64748B">👤 ${e.client}</div>`:""}${e.notes?`<div style="font-size:11px;color:#94A3B8">📝 ${e.notes}</div>`:""}</div>`;
    const btns=el("div",{style:"display:flex;gap:5px;flex-shrink:0"});
    const eb=el("button",{style:sBtnStyle("#F59E0B")},"Edit"); eb.onclick=()=>{ calState.editId=e.id; calState.form={...e}; calState.showModal=true; render(); };
    const db=el("button",{style:sBtnStyle("#EF4444")},"Delete"); db.onclick=()=>{ if(confirm("Delete event?")) removeData(`events/${e.id}`); };
    btns.appendChild(eb); btns.appendChild(db); row.appendChild(btns); upBox.appendChild(row);
  });

  wrap.appendChild(calBox); wrap.appendChild(legend); wrap.appendChild(upBox);

  // Modal
  if(calState.showModal){
    const f=calState.form;
    const m=modal(calState.editId?"Edit Event":"Add Event",()=>{ calState.showModal=false; render(); });
    m.body.appendChild(field("Event Type", selectEl(Object.keys(EVENT_COLORS), f.type, v=>{ calState.form.type=v; })));
    m.body.appendChild(field("Date", inputEl("date", f.date, v=>{ calState.form.date=v; })));
    m.body.appendChild(field("Time", inputEl("time", f.time, v=>{ calState.form.time=v; })));
    m.body.appendChild(field("Property Address", inputEl("text", f.address, v=>{ calState.form.address=v; })));
    const clientInp=inputEl("text", f.client||"", v=>{ calState.form.client=v; }); clientInp.placeholder="Start typing...";
    const dl=document.createElement("datalist"); dl.id="cal-clients";
    clients.forEach(c=>{ const o=document.createElement("option"); o.value=c.name; dl.appendChild(o); });
    clientInp.setAttribute("list","cal-clients"); m.body.appendChild(dl);
    m.body.appendChild(field("Client (optional)", clientInp));
    m.body.appendChild(field("Notes (optional)", textareaEl(f.notes||"", v=>{ calState.form.notes=v; })));
    const saveBtn=el("button",{style:btnStyle("#6366F1")},"Save Event");
    saveBtn.onclick=()=>{
      if(!f.address||!f.date) return;
      if(calState.editId) updateData(`events/${calState.editId}`,{...f,id:calState.editId});
      else { const id=uid(); setData(`events/${id}`,{...f,id}); }
      calState.showModal=false; render();
    };
    m.body.appendChild(saveBtn); wrap.appendChild(m.overlay);
  }
  return wrap;
}

// ══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function el(tag, attrs={}, text="") {
  const e=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{ if(k==="style") e.style.cssText=v; else e[k]=v; });
  if(text) e.textContent=text;
  return e;
}
function inputEl(type, value, onChange) {
  const i=el("input"); i.type=type; i.value=value||"";
  i.style.cssText="width:100%;border:1.5px solid #E2E8F0;border-radius:8px;padding:8px 10px;font-size:13px;color:#374151;outline:none;box-sizing:border-box;background:#FAFBFC";
  i.oninput=e=>onChange(e.target.value);
  return i;
}
function selectEl(options, value, onChange) {
  const s=el("select"); s.style.cssText="width:100%;border:1.5px solid #E2E8F0;border-radius:8px;padding:8px 10px;font-size:13px;color:#374151;outline:none;box-sizing:border-box;background:#FAFBFC";
  options.forEach(o=>{ const opt=document.createElement("option"); opt.value=o; opt.textContent=o; if(o===value) opt.selected=true; s.appendChild(opt); });
  s.onchange=e=>onChange(e.target.value);
  return s;
}
function textareaEl(value, onChange) {
  const t=el("textarea"); t.value=value||""; t.style.cssText="width:100%;border:1.5px solid #E2E8F0;border-radius:8px;padding:8px 10px;font-size:13px;color:#374151;outline:none;box-sizing:border-box;background:#FAFBFC;height:55px;resize:vertical";
  t.oninput=e=>onChange(e.target.value);
  return t;
}
function field(label, input) {
  const w=el("div",{style:"margin-bottom:10px"});
  w.appendChild(el("label",{style:"display:block;font-size:11px;font-weight:600;color:#64748B;margin-bottom:3px"},label));
  w.appendChild(input);
  return w;
}
function modal(title, onClose) {
  const overlay=el("div",{style:"position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px"});
  const box=el("div",{style:"background:#fff;border-radius:16px;padding:22px;width:100%;max-width:440px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)"});
  const hdr=el("div",{style:"display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"});
  hdr.appendChild(el("div",{style:"font-weight:800;font-size:16px;color:#1E1B4B"},title));
  const cls=el("button",{style:"background:none;border:none;font-size:18px;cursor:pointer;color:#94A3B8"},"✕"); cls.onclick=onClose;
  hdr.appendChild(cls); box.appendChild(hdr); overlay.appendChild(box);
  return { overlay, body: box };
}
function emptyEl(text) { return el("div",{style:"text-align:center;color:#94A3B8;padding:24px 0;font-size:12px"},text); }
function pageStyle(bg,display="block",ai="",jc="") { return `min-height:100vh;background:${bg};display:${display};align-items:${ai};justify-content:${jc}`; }
const btnStyle  = bg => `background:${bg};color:#fff;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-weight:600;font-size:13px`;
const sBtnStyle = bg => `background:${bg}22;color:${bg};border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-weight:600;font-size:11px`;

// ── BOOT ─────────────────────────────────────────────────────────────────────
initListeners();
render();
