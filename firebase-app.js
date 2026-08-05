import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, collection,
  serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, OWNER_UID } from "./firebase-config.js";

const configured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("PASTE_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("PASTE_");

buildUI();

if (!configured) {
  showGate(
    "Firebase ချိတ်ဆက်ရန်လိုသည်",
    "public/firebase-config.js ထဲ Firebase Config ကို အရင်ဖြည့်ပါ။ OWNER_UID ကို ပထမ Login ပြီးမှ ထည့်နိုင်သည်။",
    "",
    "config"
  );
} else {
  boot();
}

function buildUI() {
  const style = document.createElement("style");
  style.textContent = `
  .fb-gate{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(circle at 20% 0%,rgba(216,176,68,.22),transparent 34%),linear-gradient(180deg,#fffaf0,#efe2c5);font-family:"Noto Sans Myanmar","Pyidaungsu","Myanmar Text",system-ui,sans-serif}
  .fb-gate.hidden{display:none}.fb-card{width:min(100%,430px);background:#fffdf7;border:1px solid #e5d6ae;border-radius:24px;padding:22px;box-shadow:0 22px 60px rgba(75,49,0,.18);color:#2e271c;text-align:center}
  .fb-logo{width:68px;height:68px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;font-size:34px;color:#fff;background:linear-gradient(145deg,#c8991e,#765400)}
  .fb-card h2{font-size:21px;margin:0 0 8px;line-height:1.5}.fb-card p{font-size:13px;line-height:1.7;color:#756b5a;margin:6px 0}
  .fb-account{margin:14px 0;padding:11px;border-radius:13px;background:#f8f1df;border:1px solid #e5d6ae;font-size:12px;overflow-wrap:anywhere;white-space:pre-line}
  .fb-btn{border:1px solid #d9c79a;background:#fff;color:#2e271c;border-radius:13px;padding:11px 14px;font:700 13px inherit;cursor:pointer;margin:5px}
  .fb-btn.primary{background:#9b7200;border-color:#9b7200;color:#fff}.fb-btn.danger{color:#9b2f2f;background:#fff7f7;border-color:#eac1c1}
  .fb-spin{width:32px;height:32px;margin:14px auto;border-radius:50%;border:3px solid #eadfca;border-top-color:#9b7200;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  .fb-admin-open{position:fixed;z-index:9000;right:14px;top:78px;border:0;border-radius:999px;padding:10px 13px;background:#6d4e00;color:#fff;font:700 12px inherit;box-shadow:0 8px 24px rgba(61,41,0,.26);display:none}
  .fb-admin-open.show{display:block}.fb-admin{position:fixed;inset:0;z-index:11000;background:rgba(36,28,16,.62);display:none;align-items:flex-end;justify-content:center;font-family:"Noto Sans Myanmar","Pyidaungsu","Myanmar Text",system-ui,sans-serif}
  .fb-admin.show{display:flex}.fb-sheet{width:min(900px,100%);height:min(92vh,900px);background:#fffdf7;border-radius:25px 25px 0 0;padding:17px;overflow:auto;color:#2e271c}
  .fb-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.fb-head h2{font-size:19px;margin:0}
  .fb-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.fb-summary div{padding:11px;border:1px solid #e5d6ae;border-radius:14px;background:#fff}.fb-summary b{display:block;font-size:18px;color:#8a6500}.fb-summary span{font-size:10px;color:#756b5a}
  .fb-search{width:100%;border:1px solid #d9c79a;border-radius:12px;padding:11px;font:13px inherit;margin-bottom:10px}
  .fb-user{padding:13px;border:1px solid #e5d6ae;border-radius:16px;background:#fff;margin-bottom:10px}.fb-user-top{display:flex;gap:10px;align-items:center}
  .fb-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#f0e4c6;display:grid;place-items:center;flex:0 0 auto;font-weight:800;color:#765400}
  .fb-info{min-width:0;flex:1}.fb-info b,.fb-info small{display:block;overflow-wrap:anywhere}.fb-info b{font-size:13px}.fb-info small{font-size:10px;color:#756b5a}
  .fb-status{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:800}.fb-status.active{background:#e7f6ed;color:#23613d}.fb-status.pending{background:#fff3d4;color:#815d00}.fb-status.expired,.fb-status.suspended{background:#ffe8e6;color:#8f2d2d}
  .fb-controls{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.fb-controls input{width:76px;border:1px solid #d9c79a;border-radius:10px;padding:9px;font:12px inherit}.fb-controls button{border:1px solid #d9c79a;border-radius:10px;padding:9px 10px;background:#fff;font:700 11px inherit;cursor:pointer}.fb-controls button.grant{background:#9b7200;color:#fff;border-color:#9b7200}.fb-controls button.stop{color:#972f2f;border-color:#e7bcbc}
  .fb-empty{text-align:center;color:#756b5a;padding:30px 10px;font-size:13px}
  `;
  document.head.appendChild(style);

  const gate = document.createElement("div");
  gate.id = "fbGate";
  gate.className = "fb-gate";
  gate.innerHTML = `
    <div class="fb-card">
      <div class="fb-logo">☾</div>
      <h2 id="fbTitle">Gmail ဖြင့် ဝင်ရောက်ပါ</h2>
      <p id="fbMessage">App ကို အသုံးပြုရန် Google Account ဖြင့် Login ဝင်ပါ။</p>
      <div id="fbAccount" class="fb-account" style="display:none"></div>
      <div id="fbSpin" class="fb-spin" style="display:none"></div>
      <div id="fbButtons"><button id="fbLogin" class="fb-btn primary">Google ဖြင့် Login ဝင်မည်</button></div>
    </div>`;
  document.body.appendChild(gate);

  const open = document.createElement("button");
  open.id = "fbAdminOpen";
  open.className = "fb-admin-open";
  open.textContent = "👑 Owner Dashboard";
  document.body.appendChild(open);

  const admin = document.createElement("div");
  admin.id = "fbAdmin";
  admin.className = "fb-admin";
  admin.innerHTML = `
    <div class="fb-sheet">
      <div class="fb-head">
        <div><h2>အသုံးပြုခွင့် စီမံခန့်ခွဲမှု</h2><small>Account တစ်ခုချင်းစီကို လအလိုက်ပေးသုံးရန်</small></div>
        <button id="fbClose" class="fb-btn">ပိတ်မည်</button>
      </div>
      <div class="fb-summary">
        <div><b id="fbTotal">0</b><span>Account အားလုံး</span></div>
        <div><b id="fbActive">0</b><span>သုံးခွင့်ရှိ</span></div>
        <div><b id="fbPending">0</b><span>စောင့်ဆိုင်း</span></div>
      </div>
      <input id="fbSearch" class="fb-search" placeholder="အမည် သို့မဟုတ် Gmail ရှာရန်">
      <div id="fbUsers"><div class="fb-empty">စာရင်းဖတ်နေသည်…</div></div>
    </div>`;
  document.body.appendChild(admin);
}

async function boot() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});

  let session = {user:null, active:false, owner:false};
  let cloudTimer = null;
  let ignoreLocal = false;

  const login = () => signInWithRedirect(auth, provider);
  document.getElementById("fbLogin").onclick = login;
  getRedirectResult(auth).catch(e => showGate("Login မအောင်မြင်ပါ", friendly(e), "", "login", login));

  onAuthStateChanged(auth, async user => {
    session = {user, active:false, owner:false};
    document.getElementById("fbAdminOpen").classList.remove("show");

    if (!user) {
      showGate("Gmail ဖြင့် ဝင်ရောက်ပါ","App ကို အသုံးပြုရန် Google Account ဖြင့် Login ဝင်ပါ။","","login",login);
      return;
    }

    loading("Account စစ်ဆေးနေသည်…");

    try {
      const ref = doc(db,"users",user.uid);
      let snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref,{
          uid:user.uid,
          email:user.email || "",
          displayName:user.displayName || "",
          photoURL:user.photoURL || "",
          role:"user",
          status:"pending",
          expiresAt:null,
          createdAt:serverTimestamp(),
          updatedAt:serverTimestamp()
        });
        snap = await getDoc(ref);
      }

      const data = snap.data() || {};
      const owner = user.uid === OWNER_UID;
      const expiry = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;
      const active = owner || (data.status === "active" && expiry && expiry.getTime() > Date.now());
      session = {user, active, owner, data, expiry};

      if (active) {
        document.getElementById("fbGate").classList.add("hidden");
        if (owner) document.getElementById("fbAdminOpen").classList.add("show");
        await syncCloud(user.uid);
      } else {
        const expired = data.status === "active" && expiry && expiry.getTime() <= Date.now();
        const suspended = data.status === "suspended";
        showGate(
          suspended ? "အသုံးပြုခွင့် ပိတ်ထားသည်" :
          expired ? "အသုံးပြုခွင့် သက်တမ်းကုန်ပါပြီ" :
          "ပိုင်ရှင်၏ ခွင့်ပြုချက်ကို စောင့်နေသည်",
          suspended ? "ပိုင်ရှင်မှ Account ကို ယာယီပိတ်ထားသည်။" :
          expired ? `သက်တမ်းကုန်ရက် — ${fmt(expiry)}` :
          "ပိုင်ရှင်က သုံးခွင့်ကာလ သတ်မှတ်ပြီးသည်အထိ App ကို အသုံးပြု၍ မရသေးပါ။",
          `${user.displayName || "အသုံးပြုသူ"}\n${user.email || ""}\nUID: ${user.uid}`,
          "signed",
          login,
          () => signOut(auth).then(()=>location.reload())
        );
      }
    } catch (e) {
      showGate("Firebase ချိတ်ဆက်မှုအမှား",friendly(e),`${user.email || ""}\nUID: ${user.uid}`,"signed",login,()=>signOut(auth).then(()=>location.reload()));
    }
  });

  async function syncCloud(uid) {
    await appReady();
    const ref = doc(db,"appData",uid);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data()?.state) {
      ignoreLocal = true;
      window.sanYinApp.setState(snap.data().state);
      setTimeout(()=>ignoreLocal=false,500);
    } else {
      await setDoc(ref,{state:window.sanYinApp.getState(),updatedAt:serverTimestamp()},{merge:true});
    }
  }

  window.addEventListener("sanYinLocalStateChanged", e => {
    if (!session.user || !session.active || ignoreLocal) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(async()=>{
      try{
        await setDoc(doc(db,"appData",session.user.uid),{
          state:e.detail,
          updatedAt:serverTimestamp()
        },{merge:true});
      }catch(err){console.error(err)}
    },900);
  });

  document.getElementById("fbAdminOpen").onclick = async() => {
    document.getElementById("fbAdmin").classList.add("show");
    await loadUsers();
  };
  document.getElementById("fbClose").onclick = () => document.getElementById("fbAdmin").classList.remove("show");
  document.getElementById("fbSearch").oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".fb-user").forEach(row => row.style.display = row.dataset.search.includes(q) ? "" : "none");
  };

  async function loadUsers() {
    const list = document.getElementById("fbUsers");
    list.innerHTML = `<div class="fb-empty">Account စာရင်းဖတ်နေသည်…</div>`;
    try{
      const snap = await getDocs(collection(db,"users"));
      const users = snap.docs.map(d=>({id:d.id,...d.data()}))
        .sort((a,b)=>String(a.email||"").localeCompare(String(b.email||"")));
      const now = Date.now();
      const active = users.filter(u=>{
        const exp=u.expiresAt?.toDate?u.expiresAt.toDate():null;
        return u.id===OWNER_UID || (u.status==="active"&&exp&&exp.getTime()>now);
      }).length;
      document.getElementById("fbTotal").textContent=users.length;
      document.getElementById("fbActive").textContent=active;
      document.getElementById("fbPending").textContent=users.filter(u=>u.status==="pending").length;
      list.innerHTML = users.length ? users.map(rowHTML).join("") : `<div class="fb-empty">Account မရှိသေးပါ</div>`;
      bindRows();
    }catch(e){
      list.innerHTML=`<div class="fb-empty">${esc(friendly(e))}</div>`;
    }
  }

  function rowHTML(u){
    const owner=u.id===OWNER_UID;
    const exp=u.expiresAt?.toDate?u.expiresAt.toDate():null;
    const expired=u.status==="active"&&exp&&exp.getTime()<=Date.now();
    const st=owner?"active":expired?"expired":(u.status||"pending");
    const txt=owner?"OWNER":st==="active"?"သုံးခွင့်ရှိ":st==="expired"?"သက်တမ်းကုန်":st==="suspended"?"ပိတ်ထား":"စောင့်ဆိုင်း";
    const expText=owner?"အမြဲတမ်းအသုံးပြုခွင့်":exp?`သက်တမ်းကုန် — ${fmt(exp)}`:"သက်တမ်းမသတ်မှတ်ရသေး";
    const avatar=u.photoURL?`<img class="fb-avatar" src="${attr(u.photoURL)}" alt="">`:`<div class="fb-avatar">${esc((u.displayName||u.email||"?").slice(0,1))}</div>`;
    return `<div class="fb-user" data-search="${attr(`${u.displayName||""} ${u.email||""} ${u.id}`.toLowerCase())}">
      <div class="fb-user-top">${avatar}<div class="fb-info"><b>${esc(u.displayName||"အမည်မရှိ")}</b><small>${esc(u.email||"")}</small><small>${esc(expText)}</small></div><span class="fb-status ${st}">${txt}</span></div>
      ${owner?"":`<div class="fb-controls">
        <button data-quick="${u.id}" data-month="1">၁ လ</button>
        <button data-quick="${u.id}" data-month="3">၃ လ</button>
        <button data-quick="${u.id}" data-month="6">၆ လ</button>
        <button data-quick="${u.id}" data-month="12">၁၂ လ</button>
        <input id="months-${u.id}" type="number" min="1" max="120" value="1">
        <button class="grant" data-grant="${u.id}">ပေးသုံးမည်</button>
        <button class="stop" data-stop="${u.id}">ပိတ်မည်</button>
      </div>`}
    </div>`;
  }

  function bindRows(){
    document.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>grant(b.dataset.quick,Number(b.dataset.month)));
    document.querySelectorAll("[data-grant]").forEach(b=>b.onclick=()=>{
      const n=Math.max(1,Math.min(120,Number(document.getElementById(`months-${b.dataset.grant}`).value)||1));
      grant(b.dataset.grant,n);
    });
    document.querySelectorAll("[data-stop]").forEach(b=>b.onclick=async()=>{
      if(!confirm("ဤ Account ကို ပိတ်မည်လား?")) return;
      await updateDoc(doc(db,"users",b.dataset.stop),{
        status:"suspended",updatedAt:serverTimestamp(),updatedBy:session.user.uid
      });
      await loadUsers();
    });
  }

  async function grant(uid,months){
    try{
      const ref=doc(db,"users",uid);
      const snap=await getDoc(ref);
      if(!snap.exists()) throw new Error("Account document မရှိပါ");
      const current=snap.data().expiresAt?.toDate?snap.data().expiresAt.toDate():null;
      const now=new Date();
      const base=current&&current>now?new Date(current):now;
      const expiry=addMonths(base,months);
      await updateDoc(ref,{
        status:"active",
        expiresAt:Timestamp.fromDate(expiry),
        lastGrantedMonths:months,
        updatedAt:serverTimestamp(),
        updatedBy:session.user.uid
      });
      await loadUsers();
      alert(`${months} လ သုံးခွင့်ပေးပြီးပါပြီ။\nသက်တမ်းကုန် — ${fmt(expiry)}`);
    }catch(e){alert(friendly(e))}
  }
}

function addMonths(date,months){
  const d=new Date(date),day=d.getDate();
  d.setDate(1);d.setMonth(d.getMonth()+months);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));
  return d;
}

function showGate(title,message,account,type,login,logout){
  const gate=document.getElementById("fbGate");
  gate.classList.remove("hidden");
  document.getElementById("fbTitle").textContent=title;
  document.getElementById("fbMessage").textContent=message;
  document.getElementById("fbSpin").style.display="none";
  const box=document.getElementById("fbAccount");
  box.style.display=account?"block":"none";box.textContent=account||"";
  const buttons=document.getElementById("fbButtons");buttons.innerHTML="";
  if(type==="login"){
    const b=document.createElement("button");b.className="fb-btn primary";b.textContent="Google ဖြင့် Login ဝင်မည်";b.onclick=login;buttons.appendChild(b);
  }else if(type==="signed"){
    const r=document.createElement("button");r.className="fb-btn primary";r.textContent="အခြေအနေ ပြန်စစ်မည်";r.onclick=()=>location.reload();
    const o=document.createElement("button");o.className="fb-btn";o.textContent="အခြား Gmail ဖြင့်ဝင်မည်";o.onclick=logout;
    buttons.append(r,o);
  }else{
    buttons.innerHTML="<p style='font-size:11px'>README_SETUP_MY.md ကို အဆင့်လိုက်လုပ်ပါ။</p>";
  }
}

function loading(text){
  document.getElementById("fbGate").classList.remove("hidden");
  document.getElementById("fbTitle").textContent="စစ်ဆေးနေသည်";
  document.getElementById("fbMessage").textContent=text;
  document.getElementById("fbSpin").style.display="block";
  document.getElementById("fbButtons").innerHTML="";
}

function appReady(){
  if(window.sanYinApp) return Promise.resolve();
  return new Promise(r=>window.addEventListener("sanYinAppReady",r,{once:true}));
}

function fmt(d){
  try{return new Intl.DateTimeFormat("my-MM",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d)}
  catch{return d.toLocaleString()}
}
function friendly(e){
  const map={
    "auth/unauthorized-domain":"Authentication > Settings > Authorized domains ထဲ App domain ထည့်ပါ။",
    "auth/network-request-failed":"Internet ချိတ်ဆက်မှု စစ်ဆေးပါ။",
    "permission-denied":"Firestore Rules သို့မဟုတ် OWNER_UID မှားနေသည်။",
    "firestore/permission-denied":"Firestore Rules သို့မဟုတ် OWNER_UID မှားနေသည်။"
  };
  return map[e?.code]||e?.message||"မသိရှိရသေးသောအမှား ဖြစ်သည်။";
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function attr(v){return esc(v).replace(/`/g,"&#096;")}
