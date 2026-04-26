/* ================================================================
   CONTROLPANEL.JS — Elite Route Admin Control Panel  v5.0

   Enhancements v5.0:
   - Admin Panel button in Navbar & Sidebar (wired via ER_ADMIN global)
   - Map Location Settings (embed URL + address card details)
   - Contact Details Management (phone, email, address)
   - Social / Footer Links Management (WhatsApp, Instagram, LinkedIn,
     Telegram, Facebook) editable from Admin Panel
   - Services Editor (add / edit / remove service cards)
   - Footer Quick Links & Inventory Links editor
   - Improved Dashboard with 7-day activity chart
   - Full CRUD for Cars with improved UX
   - Per-card inquiry delete
   - Settings: consolidated into tabbed settings pane
================================================================ */

(function () {
  'use strict';

  const CFG = Object.freeze({
    PASSWORD       : 'adminpass',
    MAX_ATTEMPTS   : 5,
    LOCKOUT_MS     : 30_000,
    SESSION_TTL_MS : 30 * 60_000,
    SK_AUTH        : 'er_admin_auth',
    SK_INQUIRIES   : 'er_inquiries',
    SK_CARS        : 'er_cars_override',
    SK_SERVICES    : 'er_services',
    SK_SOCIALS     : 'er_socials',
    SK_CONTACT     : 'er_contact',
    SK_FOOTLINKS   : 'er_footlinks',
  });

  const DEFAULT_CONTACT = {
    phone   : '+971 50 123 4567',
    email   : 'export@eliteroute.com',
    address : 'Auto Hub Center, Ras Al Khor, Dubai, UAE',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115408.09799763787!2d55.20529432653805!3d25.075009587440046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43496ad9c645%3A0xbde66e5084295162!2sDubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sph!4v1708000000000!5m2!1sen!2sph',
  };
  const DEFAULT_SOCIALS = { whatsapp:'971501234567', instagram:'', linkedin:'', telegram:'', facebook:'' };
  const DEFAULT_SERVICES = [
    {id:1,icon:'fas fa-ship',          title:'Global Logistics',    desc:'RoRo and container freight handled end-to-end, ensuring vehicles arrive safely at any port worldwide with full insurance.'},
    {id:2,icon:'fas fa-shield-halved', title:'Armored Sourcing',    desc:'Direct VR6/VR7 certified armorers. We source, build, and export protection vehicles for high-profile clients.'},
    {id:3,icon:'fas fa-file-contract', title:'Customs & Clearance', desc:'Homologation, import taxes, Letters of Credit, and port clearance across 48+ countries.'},
    {id:4,icon:'fas fa-gem',           title:'Exotic Allocations',  desc:'Skip waitlists entirely. Limited-edition supercars unavailable to the open market, sourced exclusively for you.'},
    {id:5,icon:'fas fa-users',         title:'Fleet Management',    desc:'Bulk fleet procurement and export for governments, corporations, and humanitarian organizations.'},
    {id:6,icon:'fas fa-certificate',   title:'Title & Compliance',  desc:'Full legal compliance, title transfer, VIN verification, and manufacturer certification per exported unit.'},
  ];
  const DEFAULT_FOOTLINKS = {
    quickLinks:[{label:'Home',href:'#home'},{label:'Showroom',href:'#showroom'},{label:'Services',href:'#services'},{label:'Get a Quote',href:'#contact'}],
    inventory:[{label:'Luxury Sedans',href:'#showroom'},{label:'SUVs & 4x4',href:'#showroom'},{label:'Armored Vehicles',href:'#showroom'},{label:'Exotic / Hypercars',href:'#showroom'},{label:'Fleet Solutions',href:'#showroom'}],
  };

  let isAdmin=false, inqFilter='all', editingId=null, editingSvcId=null, inventorySearch='', settingsTab='contact', _idleTimer=null, _focusTrap=null;
  let inquiries = _loadJSON(CFG.SK_INQUIRIES, []);
  let contact   = _loadJSON(CFG.SK_CONTACT,   DEFAULT_CONTACT);
  let socials   = _loadJSON(CFG.SK_SOCIALS,   DEFAULT_SOCIALS);
  let services  = _loadJSON(CFG.SK_SERVICES,  DEFAULT_SERVICES);
  let footlinks = _loadJSON(CFG.SK_FOOTLINKS, DEFAULT_FOOTLINKS);

  /* --- SECURITY --- */
  function _sessionValid(){try{const r=sessionStorage.getItem(CFG.SK_AUTH);if(!r)return false;const{ok,ts}=JSON.parse(r);if(!ok||!ts)return false;if(Date.now()-ts>CFG.SESSION_TTL_MS){sessionStorage.removeItem(CFG.SK_AUTH);return false;}return true;}catch(_){return false;}}
  function _sessionStart(){sessionStorage.setItem(CFG.SK_AUTH,JSON.stringify({ok:true,ts:Date.now()}));}
  function _sessionRefresh(){if(_sessionValid())_sessionStart();}
  function _sessionEnd(){sessionStorage.removeItem(CFG.SK_AUTH);}
  const _bf={count:0,lockedUntil:0};
  function _bfCheck(){return Date.now()>=_bf.lockedUntil;}
  function _bfFail(){_bf.count++;if(_bf.count>=CFG.MAX_ATTEMPTS){_bf.lockedUntil=Date.now()+CFG.LOCKOUT_MS;_bf.count=0;}}
  function _bfReset(){_bf.count=0;_bf.lockedUntil=0;}
  function _lockoutRemaining(){const r=_bf.lockedUntil-Date.now();return r>0?Math.ceil(r/1000):0;}
  function _resetIdleTimer(){clearTimeout(_idleTimer);if(!isAdmin)return;_idleTimer=setTimeout(()=>{doLogout();toast('Session expired.');},CFG.SESSION_TTL_MS);}

  /* --- STORAGE --- */
  function _loadJSON(k,fb){try{return JSON.parse(localStorage.getItem(k))||fb;}catch(_){return fb;}}
  function _saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){if(e.name==='QuotaExceededError')toast('Storage limit reached!');return false;}}
  function saveInquiries(){_saveJSON(CFG.SK_INQUIRIES,inquiries);}
  function saveCars(){_saveJSON(CFG.SK_CARS,getProducts());}
  function saveContact(){_saveJSON(CFG.SK_CONTACT,contact);}
  function saveSocials(){_saveJSON(CFG.SK_SOCIALS,socials);}
  function saveServices(){_saveJSON(CFG.SK_SERVICES,services);}
  function saveFootlinks(){_saveJSON(CFG.SK_FOOTLINKS,footlinks);}

  /* --- PRODUCTS BRIDGE --- */
  function getProducts(){return(window.ER&&typeof window.ER.getProducts==='function')?window.ER.getProducts():[];}
  function mutateProducts(a){if(Array.isArray(a)&&window.ER&&typeof window.ER.setProducts==='function')window.ER.setProducts(a);}
  function triggerRerender(){if(window.ER&&typeof window.ER.rerender==='function')window.ER.rerender();}
  function nextId(){const ids=getProducts().map(p=>p.id).filter(Number.isFinite);return ids.length?Math.max(...ids)+1:1;}
  function restoreCarOverrides(){const s=_loadJSON(CFG.SK_CARS,null);if(Array.isArray(s)&&s.length)mutateProducts(s);}
  function toast(msg){if(window.ER&&typeof window.ER.showToast==='function')window.ER.showToast(msg);}

  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}
  function safeUrl(v){try{const u=new URL(v);return(u.protocol==='https:'||u.protocol==='http:'||v.startsWith('data:image'))?v:'';}catch(_){return v.startsWith('data:image')?v:'';}}
  function fmtDate(ts){const d=new Date(ts);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
  function isoDate(){return new Date().toISOString().split('T')[0];}

  function _triggerDownload(blob,name){const u=URL.createObjectURL(blob);const a=Object.assign(document.createElement('a'),{href:u,download:name});document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(u),60000);}
  function exportJSON(d,n){_triggerDownload(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),n);}
  function escCSV(s){return!s?'""':`"${String(s).replace(/"/g,'""').replace(/\n/g,' ')}"`;} 
  function exportInquiriesCSV(){if(!inquiries.length){toast('No inquiries to export.');return;}const h=['Date','Type','Car ID','Car Title','Budget/Price','Name','Email','Phone','Destination','Interest','Notes'];const r=inquiries.map(i=>[fmtDate(i.ts).replace(/,/g,''),i.type||'inquiry',i.carId??'General',escCSV(i.carTitle),escCSV(i.carPrice||i.budget),escCSV(i.name),escCSV(i.email),escCSV(i.phone),escCSV(i.destination),escCSV(i.interest),escCSV(i.notes)]);const csv=[h.join(','),...r.map(row=>row.join(','))].join('\n');_triggerDownload(new Blob([csv],{type:'text/csv;charset=utf-8;'}),`er_inquiries_${isoDate()}.csv`);}


  /* ================================================================
     INJECT STYLES
  ================================================================ */
  function injectStyles(){
    const css=`
      #er-panel{display:none;position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.92);backdrop-filter:blur(12px);justify-content:center;align-items:flex-start;overflow-y:auto;padding:0;opacity:0;transition:opacity .3s ease;}
      #er-panel.open{display:flex;}
      #er-panel.open.visible{opacity:1;}
      .erb{background:#111113;border:1px solid rgba(255,59,48,.2);border-radius:14px;width:100%;max-width:1060px;margin:28px 14px 80px;box-shadow:0 24px 70px rgba(0,0,0,.95);font-family:'Montserrat',sans-serif;overflow:hidden;transform:translateY(18px) scale(0.975);transition:transform .35s cubic-bezier(.22,.68,0,1.2);}
      #er-panel.open.visible .erb{transform:translateY(0) scale(1);}
      .erb-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 26px;background:linear-gradient(90deg,#0c0c0e,#151517);border-bottom:1px solid rgba(255,59,48,.16);}
      .erb-logo{font-size:1.05rem;font-weight:700;letter-spacing:3px;color:#f4f4f5;}
      .erb-logo span{color:#ff3b30;}
      .erb-badge{font-size:.55rem;letter-spacing:2px;text-transform:uppercase;background:rgba(255,59,48,.1);border:1px solid rgba(255,59,48,.3);color:#ff3b30;padding:3px 10px;border-radius:2px;margin-left:10px;}
      .erb-x{background:none;border:1px solid rgba(255,255,255,.1);color:#a1a1aa;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.88rem;cursor:pointer;transition:.2s;flex-shrink:0;}
      .erb-x:hover{background:#ff3b30;border-color:#ff3b30;color:#fff;}
      .er-login{max-width:340px;margin:52px auto;text-align:center;padding:0 24px;}
      .er-login h3{font-size:1.4rem;font-weight:700;letter-spacing:2px;color:#f4f4f5;margin-bottom:6px;}
      .er-login p{font-size:.8rem;color:#a1a1aa;margin-bottom:26px;line-height:1.6;}
      .er-login-err,.er-login-lock{font-size:.76rem;margin-top:10px;display:none;line-height:1.5;}
      .er-login-err{color:#ff3b30;}.er-login-lock{color:#f59e0b;}
      .er-inp,.er-sel,.er-ta{width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#f4f4f5;border-radius:7px;font-size:.86rem;font-family:'Montserrat',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;}
      .er-sel option{background:#111113;color:#f4f4f5;}
      .er-inp:focus,.er-sel:focus,.er-ta:focus{border-color:#ff3b30;box-shadow:0 0 0 3px rgba(255,59,48,.12);}
      .er-inp:disabled,.er-sel:disabled{opacity:.45;cursor:not-allowed;}
      .er-ta{resize:vertical;min-height:72px;}
      .er-inp-mb{margin-bottom:12px;}
      .er-btn{padding:10px 22px;background:#ff3b30;border:none;color:#fff;font-family:'Montserrat',sans-serif;font-weight:700;font-size:.8rem;letter-spacing:2px;text-transform:uppercase;border-radius:7px;cursor:pointer;transition:background .2s,box-shadow .2s,transform .15s;display:inline-flex;align-items:center;gap:7px;}
      .er-btn:hover{background:#d63026;box-shadow:0 4px 16px rgba(255,59,48,.35);}
      .er-btn:active{transform:scale(.97);}
      .er-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}
      .er-btn.sec{background:transparent;border:1px solid rgba(255,59,48,.4);color:#ff3b30;}
      .er-btn.sec:hover{background:rgba(255,59,48,.1);}
      .er-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.12);color:#a1a1aa;}
      .er-btn.ghost:hover{border-color:rgba(255,59,48,.4);color:#ff3b30;background:rgba(255,59,48,.05);}
      .er-btn.danger{background:#b91c1c;border:1px solid #b91c1c;}
      .er-btn.danger:hover{background:#991b1b;box-shadow:0 4px 16px rgba(185,28,28,.4);}
      .er-btn.sm{padding:6px 13px;font-size:.68rem;letter-spacing:1.5px;}
      .er-btn.full{width:100%;justify-content:center;}
      .er-tabs{display:flex;gap:2px;padding:14px 26px 0;border-bottom:1px solid rgba(255,255,255,.05);background:#0f0f11;overflow-x:auto;}
      .er-tabs::-webkit-scrollbar{display:none;}
      .er-tab{padding:9px 16px;font-size:.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;color:#71717a;background:none;border:none;border-bottom:2px solid transparent;font-family:'Montserrat',sans-serif;transition:color .2s,border-color .2s;white-space:nowrap;}
      .er-tab.on{color:#ff3b30;border-bottom-color:#ff3b30;}
      .er-tab:hover:not(.on){color:#f4f4f5;}
      .er-pane{display:none;padding:26px;}
      .er-pane.on{display:block;}
      .er-stitle{font-size:.65rem;letter-spacing:3px;text-transform:uppercase;color:#ff3b30;font-weight:700;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
      .er-stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px;}
      .er-stat{flex:1;min-width:110px;background:rgba(255,59,48,.06);border:1px solid rgba(255,59,48,.14);border-radius:10px;padding:16px 18px;transition:border-color .2s,transform .2s;cursor:default;}
      .er-stat:hover{border-color:rgba(255,59,48,.35);transform:translateY(-2px);}
      .er-stat-v{font-size:1.65rem;font-weight:700;color:#ff3b30;line-height:1;}
      .er-stat-l{font-size:.6rem;letter-spacing:2px;color:#71717a;text-transform:uppercase;margin-top:5px;}
      .er-tbl{width:100%;border-collapse:collapse;}
      .er-tbl th{text-align:left;font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#71717a;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);}
      .er-tbl td{padding:11px 10px;font-size:.82rem;color:#f4f4f5;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle;}
      .er-tbl tr:hover td{background:rgba(255,59,48,.04);}
      .er-thumb{width:64px;height:44px;object-fit:cover;border-radius:5px;border:1px solid rgba(255,255,255,.08);display:block;}
      .er-pill{font-size:.56rem;letter-spacing:1.5px;padding:2px 8px;border-radius:2px;font-weight:700;text-transform:uppercase;background:rgba(255,59,48,.14);color:#ff3b30;border:1px solid rgba(255,59,48,.28);display:inline-block;}
      .er-actrow{display:flex;gap:5px;flex-wrap:wrap;}
      .er-grid2{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:18px;}
      .er-frow{display:flex;flex-direction:column;gap:5px;}
      .er-frow.full{grid-column:1/-1;}
      .er-frow label{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#71717a;font-weight:600;}
      .er-frow small{font-size:.62rem;color:#52525b;margin-top:-2px;}
      .er-divider{grid-column:1/-1;font-size:.63rem;letter-spacing:2.5px;color:#ff3b30;text-transform:uppercase;padding:6px 0 2px;border-top:1px solid rgba(255,59,48,.12);margin-top:4px;}
      .er-form-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:6px;}
      .er-inq-filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;}
      .er-inq-tag{font-size:.64rem;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);color:#71717a;cursor:pointer;background:none;font-family:'Montserrat',sans-serif;font-weight:600;transition:.2s;}
      .er-inq-tag.on,.er-inq-tag:hover{background:rgba(255,59,48,.1);border-color:rgba(255,59,48,.35);color:#ff3b30;}
      .er-grp{margin-bottom:28px;}
      .er-grp-hdr{display:flex;align-items:center;gap:10px;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:#f4f4f5;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,59,48,.14);}
      .er-grp-hdr img{width:52px;height:36px;object-fit:cover;border-radius:4px;border:1px solid rgba(255,255,255,.1);flex-shrink:0;}
      .er-grp-cnt{margin-left:auto;font-size:.6rem;background:rgba(255,59,48,.14);border:1px solid rgba(255,59,48,.28);color:#ff3b30;padding:2px 9px;border-radius:10px;white-space:nowrap;}
      .er-inq-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:9px;padding:13px 15px;margin-bottom:7px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;transition:border-color .2s;}
      .er-inq-card:hover{border-color:rgba(255,59,48,.2);}
      .er-inq-name{font-size:.88rem;font-weight:700;color:#f4f4f5;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
      .er-inq-type{font-size:.55rem;padding:2px 6px;background:#ff3b30;color:#fff;border-radius:2px;letter-spacing:1px;text-transform:uppercase;}
      .er-inq-meta{display:flex;flex-wrap:wrap;gap:8px;font-size:.73rem;color:#a1a1aa;}
      .er-inq-meta span{display:flex;align-items:center;gap:4px;}
      .er-inq-meta i{color:#ff3b30;font-size:.66rem;}
      .er-inq-note{margin-top:7px;font-size:.75rem;color:#a1a1aa;font-style:italic;border-top:1px solid rgba(255,255,255,.05);padding-top:7px;}
      .er-inq-ts{font-size:.6rem;color:#52525b;white-space:nowrap;margin-bottom:6px;}
      .er-inq-del{background:none;border:1px solid rgba(255,255,255,.08);color:#71717a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;cursor:pointer;transition:.2s;flex-shrink:0;}
      .er-inq-del:hover{background:#b91c1c;border-color:#b91c1c;color:#fff;}
      .er-empty{text-align:center;color:#71717a;font-size:.84rem;padding:40px 0;}
      .er-img-prev{width:100%;max-height:130px;object-fit:cover;border-radius:7px;border:1px solid rgba(255,59,48,.2);margin-top:6px;display:none;}
      #er-session-bar{font-size:.58rem;letter-spacing:1.5px;color:#52525b;text-align:right;padding:4px 26px 0;background:#0f0f11;}
      #er-panel *::-webkit-scrollbar{width:4px;height:4px;}
      #er-panel *::-webkit-scrollbar-track{background:transparent;}
      #er-panel *::-webkit-scrollbar-thumb{background:#ff3b30;border-radius:2px;}
      .er-set-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:22px;}
      .er-set-tab{font-size:.64rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 16px;border-radius:20px;border:1px solid rgba(255,255,255,.1);color:#71717a;cursor:pointer;background:none;font-family:'Montserrat',sans-serif;transition:.2s;}
      .er-set-tab.on,.er-set-tab:hover{background:rgba(255,59,48,.1);border-color:rgba(255,59,48,.35);color:#ff3b30;}
      .er-set-pane{display:none;}
      .er-set-pane.on{display:block;}
      .er-svc-list{display:flex;flex-direction:column;gap:8px;margin-bottom:18px;}
      .er-svc-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:14px 16px;display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;transition:border-color .2s;}
      .er-svc-item:hover{border-color:rgba(255,59,48,.2);}
      .er-svc-icon-prev{width:36px;height:36px;background:rgba(255,59,48,.1);border:1px solid rgba(255,59,48,.2);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#ff3b30;font-size:.95rem;flex-shrink:0;}
      .er-svc-text h5{font-size:.84rem;font-weight:700;color:#f4f4f5;margin-bottom:3px;}
      .er-svc-text p{font-size:.72rem;color:#71717a;line-height:1.5;}
      .er-soc-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:4px;}
      .er-soc-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:12px 14px;}
      .er-soc-icon{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,59,48,.25);display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#ff3b30;flex-shrink:0;}
      .er-soc-row .er-inp{flex:1;}
      .er-map-prev{width:100%;height:180px;border-radius:9px;border:1px solid rgba(255,59,48,.2);overflow:hidden;margin-top:8px;}
      .er-map-prev iframe{width:100%;height:100%;border:none;filter:invert(90%) hue-rotate(180deg) brightness(.85);}
      .er-link-list{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
      .er-link-item{display:flex;gap:8px;align-items:center;}
      .er-link-item .er-inp{flex:1;}
      .er-link-del{background:none;border:1px solid rgba(255,255,255,.08);color:#71717a;width:30px;height:30px;min-width:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;cursor:pointer;transition:.2s;}
      .er-link-del:hover{background:#b91c1c;border-color:#b91c1c;color:#fff;}
      .er-chart-wrap{background:rgba(255,59,48,.04);border:1px solid rgba(255,59,48,.1);border-radius:10px;padding:18px;margin-bottom:22px;}
      .er-chart-title{font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:#71717a;margin-bottom:14px;}
      .er-chart-bars{display:flex;gap:6px;align-items:flex-end;height:80px;}
      .er-chart-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;}
      .er-chart-bar{width:100%;background:rgba(255,59,48,.25);border-radius:3px 3px 0 0;transition:height .6s ease,background .2s;min-height:2px;}
      .er-chart-bar:hover{background:#ff3b30;}
      .er-chart-lbl{font-size:.52rem;color:#52525b;letter-spacing:.5px;}
      .er-svc-form-box{background:rgba(255,59,48,.04);border:1px solid rgba(255,59,48,.12);border-radius:10px;padding:20px;margin-top:4px;}
      @media(max-width:640px){.er-grid2{grid-template-columns:1fr;}.er-soc-grid{grid-template-columns:1fr;}.er-tbl th:nth-child(1),.er-tbl td:nth-child(1),.er-tbl th:nth-child(5),.er-tbl td:nth-child(5){display:none;}.er-tab{padding:8px 10px;font-size:.6rem;}.er-pane{padding:16px;}}
    `;
    const s=document.createElement('style');s.id='er-styles';s.textContent=css;document.head.appendChild(s);
  }