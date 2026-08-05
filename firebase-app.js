import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, collection,
  serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, OWNER_UID } from "./firebase-config.js";

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const configured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("PASTE_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("PASTE_");

buildUI();

if (!configured) {
  showGate(
    "Firebase ချိတ်ဆက်ရန်လိုသည်",
    "public/firebase-config.js ထဲ Firebase Config ကို အရင်ဖြည့်ပါ။",
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
  .fb-admin.show{display:flex}.fb-sheet{width:min(900px,100%);height:min(94vh,940px);background:#fffdf7;border-radius:25px 25px 0 0;padding:17px;overflow:auto;color:#2e271c}
  .fb-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.fb-head h2{font-size:19px;margin:0}
  .fb-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.fb-summary div{padding:11px;border:1px solid #e5d6ae;border-radius:14px;background:#fff}.fb-summary b{display:block;font-size:18px;color:#8a6500}.fb-summary span{font-size:10px;color:#756b5a}
  .fb-search{width:100%;border:1px solid #d9c79a;border-radius:12px;padding:11px;font:13px inherit;margin-bottom:10px}
  .fb-user{padding:13px;border:1px solid #e5d6ae;border-radius:16px;background:#fff;margin-bottom:10px}.fb-user-top{display:flex;gap:10px;align-items:center}
  .fb-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#f0e4c6;display:grid;place-items:center;flex:0 0 auto;font-weight:800;color:#765400}
  .fb-info{min-width:0;flex:1}.fb-info b,.fb-info small{display:block;overflow-wrap:anywhere}.fb-info b{font-size:13px}.fb-info small{font-size:10px;color:#756b5a;line-height:1.55}
  .fb-status{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:800}.fb-status.active{background:#e7f6ed;color:#23613d}.fb-status.pending{background:#fff3d4;color:#815d00}.fb-status.expired,.fb-status.suspended{background:#ffe8e6;color:#8f2d2d}
  .fb-controls{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.fb-controls input{width:76px;border:1px solid #d9c79a;border-radius:10px;padding:9px;font:12px inherit}.fb-controls button{border:1px solid #d9c79a;border-radius:10px;padding:9px 10px;background:#fff;font:700 11px inherit;cursor:pointer}.fb-controls button.grant{background:#9b7200;color:#fff;border-color:#9b7200}.fb-controls button.stop{color:#972f2f;border-color:#e7bcbc}
  .fb-date-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px;padding:10px;border-radius:13px;background:#fbf6e9;border:1px solid #eadbb7}
  .fb-date-grid label{font-size:10px;font-weight:800;color:#6d624e;margin:0}.fb-date-grid input{width:100%;margin-top:5px;border:1px solid #d9c79a;border-radius:9px;padding:8px 7px;font:11px inherit;background:#fff}
  .fb-empty{text-align:center;color:#756b5a;padding:30px 10px;font-size:13px}
  @media(max-width:430px){.fb-date-grid{grid-template-columns:1fr}.fb-controls input{width:70px}}
  `;
  document.head.appendChild(style);

  const gate = document.createElement("div");
  gate.id = "fbGate";
  gate.className = "fb-gate";
  gate.innerHTML = `
    <div class="fb-card">
      <div class="fb-logo">☾</div>
      <h2 id="fbTitle">Gmail ဖြင့် ဝင်ရောက်ပါ</h2>
      <p id="fbMessage">ပထမဆုံး Login ဝင်သူကို ၇ ရက် အခမဲ့သုံးခွင့်ပေးမည်။</p>
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
        <div>
          <h2>အသုံးပြုခွင့် စီမံခန့်ခွဲမှု</h2>
          <small>သက်တမ်းပြောင်းလျှင် ရှိပြီးသားကာလနှင့် မပေါင်းဘဲ မူလစတင်ရက်မှ ပြန်သတ်မှတ်မည်</small>
        </div>
        <button id="fbClose" class="fb-btn">ပိတ်မည်</button>
      </div>
      <div class="fb-summary">
        <div><b id="fbTotal">0</b><span>Account အားလုံး</span></div>
        <div><b id="fbActive">0</b><span>သုံးခွင့်ရှိ</span></div>
        <div><b id="fbPending">0</b><span>စောင့်ဆိုင်း/ကုန်ဆုံး</span></div>
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
  provider.setCustomParameters({ prompt: "select_account" });

  let session = { user: null, active: false, owner: false, expiry: null };
  let cloudTimer = null;
  let ignoreLocal = false;
  let badgeTimer = null;

  const login = async () => {
    loading("Google Account ရွေးချယ်ရန် ဖွင့်နေသည်…");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google login failed:", e);
      showGate("Login မအောင်မြင်ပါ", friendly(e), "", "login", login);
    }
  };

  document.getElementById("fbLogin").onclick = login;

  onAuthStateChanged(auth, async user => {
    session = { user, active: false, owner: false, expiry: null };
    clearInterval(badgeTimer);
    hideAccessBadge();
    document.getElementById("fbAdminOpen").classList.remove("show");

    if (!user) {
      showGate(
        "Gmail ဖြင့် ဝင်ရောက်ပါ",
        "ပထမဆုံး Login ဝင်သူကို ၇ ရက် အခမဲ့သုံးခွင့်ပေးမည်။",
        "",
        "login",
        login
      );
      return;
    }

    loading("Account စစ်ဆေးနေသည်…");

    try {
      const ref = doc(db, "users", user.uid);
      let snap = await getDoc(ref);

      if (!snap.exists()) {
        const now = new Date();
        const expiry = addDays(now, TRIAL_DAYS);
        await setDoc(ref, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: "user",
          status: "active",
          subscriptionStartAt: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiry),
          trialStartedAt: serverTimestamp(),
          trialDays: TRIAL_DAYS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        snap = await getDoc(ref);
      } else if (isUnusedPendingAccount(snap.data())) {
        // ယခင် version မှ pending account များကို တစ်ကြိမ်တည်း ၇ ရက် Trial ပြောင်းပေးသည်။
        const now = new Date();
        const expiry = addDays(now, TRIAL_DAYS);
        await updateDoc(ref, {
          status: "active",
          subscriptionStartAt: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiry),
          trialStartedAt: serverTimestamp(),
          trialDays: TRIAL_DAYS,
          updatedAt: serverTimestamp()
        });
        snap = await getDoc(ref);
      }

      const data = snap.data() || {};
      const owner = user.uid === OWNER_UID;
      const expiry = toDate(data.expiresAt);
      const active = owner || (
        data.status === "active" &&
        expiry &&
        expiry.getTime() > Date.now()
      );

      session = { user, active, owner, data, expiry };

      await appReady();
      window.sanYinApp.setOwnerRole(owner);

      if (active) {
        document.getElementById("fbGate").classList.add("hidden");
        if (owner) document.getElementById("fbAdminOpen").classList.add("show");

        updateAccessBadge(owner, expiry);
        badgeTimer = setInterval(() => {
          updateAccessBadge(owner, expiry);
          if (!owner && expiry && expiry.getTime() <= Date.now()) location.reload();
        }, 60000);

        await syncCloud(user.uid);
        window.sanYinApp.prefillFirstName(user.displayName || "");
      } else {
        const expired = data.status === "active" && expiry && expiry.getTime() <= Date.now();
        const suspended = data.status === "suspended";

        showGate(
          suspended ? "အသုံးပြုခွင့် ပိတ်ထားသည်" :
          expired ? "အသုံးပြုခွင့် သက်တမ်းကုန်ပါပြီ" :
          "အသုံးပြုခွင့် မရှိသေးပါ",
          suspended ? "ပိုင်ရှင်မှ Account ကို ယာယီပိတ်ထားသည်။" :
          expired ? `သက်တမ်းကုန်ရက် — ${fmt(expiry)}` :
          "ပိုင်ရှင်ထံ ဆက်သွယ်၍ သက်တမ်းတိုးပါ။",
          `${user.displayName || "အသုံးပြုသူ"}\n${user.email || ""}\nUID: ${user.uid}`,
          "signed",
          login,
          () => signOut(auth).then(() => location.reload())
        );
      }
    } catch (e) {
      console.error(e);
      showGate(
        "Firebase ချိတ်ဆက်မှုအမှား",
        friendly(e),
        `${user.email || ""}\nUID: ${user.uid}`,
        "signed",
        login,
        () => signOut(auth).then(() => location.reload())
      );
    }
  });

  async function syncCloud(uid) {
    await appReady();
    const ref = doc(db, "appData", uid);
    const snap = await getDoc(ref);

    if (snap.exists() && snap.data()?.state) {
      ignoreLocal = true;
      window.sanYinApp.setState(snap.data().state);
      setTimeout(() => { ignoreLocal = false; }, 500);
    } else {
      window.sanYinApp.resetForNewUser(session.user?.displayName || "");
      await setDoc(ref, {
        state: window.sanYinApp.getState(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  window.addEventListener("sanYinLocalStateChanged", event => {
    if (!session.user || !session.active || ignoreLocal) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "appData", session.user.uid), {
          state: event.detail,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Cloud save failed:", error);
      }
    }, 900);
  });

  document.getElementById("fbAdminOpen").onclick = async () => {
    document.getElementById("fbAdmin").classList.add("show");
    await loadUsers();
  };
  document.getElementById("fbClose").onclick = () => {
    document.getElementById("fbAdmin").classList.remove("show");
  };
  document.getElementById("fbSearch").oninput = event => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll(".fb-user").forEach(row => {
      row.style.display = row.dataset.search.includes(query) ? "" : "none";
    });
  };

  async function loadUsers() {
    const list = document.getElementById("fbUsers");
    list.innerHTML = `<div class="fb-empty">Account စာရင်းဖတ်နေသည်…</div>`;

    try {
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .sort((a, b) => String(a.email || "").localeCompare(String(b.email || "")));

      const now = Date.now();
      const activeCount = users.filter(userData => {
        const expiry = toDate(userData.expiresAt);
        return userData.id === OWNER_UID ||
          (userData.status === "active" && expiry && expiry.getTime() > now);
      }).length;

      document.getElementById("fbTotal").textContent = users.length;
      document.getElementById("fbActive").textContent = activeCount;
      document.getElementById("fbPending").textContent = users.length - activeCount;

      list.innerHTML = users.length
        ? users.map(rowHTML).join("")
        : `<div class="fb-empty">Account မရှိသေးပါ</div>`;

      bindRows();
    } catch (e) {
      list.innerHTML = `<div class="fb-empty">${esc(friendly(e))}</div>`;
    }
  }

  function rowHTML(userData) {
    const owner = userData.id === OWNER_UID;
    const start = toDate(userData.subscriptionStartAt) || toDate(userData.createdAt);
    const expiry = toDate(userData.expiresAt);
    const expired = userData.status === "active" && expiry && expiry.getTime() <= Date.now();
    const status = owner ? "active" : expired ? "expired" : (userData.status || "pending");
    const statusText = owner ? "OWNER" :
      status === "active" ? "သုံးခွင့်ရှိ" :
      status === "expired" ? "သက်တမ်းကုန်" :
      status === "suspended" ? "ပိတ်ထား" : "စောင့်ဆိုင်း";

    const remain = owner ? "" : expiry ? ` · ${remainingDays(expiry)} ရက်ကျန်` : "";
    const expiryText = owner
      ? "အမြဲတမ်းအသုံးပြုခွင့်"
      : expiry
        ? `စတင် — ${fmtDate(start)} · ကုန်ဆုံး — ${fmtDate(expiry)}${remain}`
        : "သက်တမ်းမသတ်မှတ်ရသေး";

    const avatar = userData.photoURL
      ? `<img class="fb-avatar" src="${attr(userData.photoURL)}" alt="">`
      : `<div class="fb-avatar">${esc((userData.displayName || userData.email || "?").slice(0, 1))}</div>`;

    return `<div class="fb-user" data-search="${attr(`${userData.displayName || ""} ${userData.email || ""} ${userData.id}`.toLowerCase())}">
      <div class="fb-user-top">
        ${avatar}
        <div class="fb-info">
          <b>${esc(userData.displayName || "အမည်မရှိ")}</b>
          <small>${esc(userData.email || "")}</small>
          <small>${esc(expiryText)}</small>
        </div>
        <span class="fb-status ${status}">${statusText}</span>
      </div>
      ${owner ? "" : `
        <div class="fb-controls">
          <button data-period="${userData.id}" data-unit="days" data-value="7">၇ ရက်</button>
          <button data-period="${userData.id}" data-unit="months" data-value="1">၁ လ</button>
          <button data-period="${userData.id}" data-unit="months" data-value="3">၃ လ</button>
          <button data-period="${userData.id}" data-unit="months" data-value="6">၆ လ</button>
          <button data-period="${userData.id}" data-unit="months" data-value="12">၁၂ လ</button>
          <input id="months-${userData.id}" type="number" min="1" max="120" value="1" aria-label="လအရေအတွက်">
          <button class="grant" data-custom-months="${userData.id}">လပြောင်းမည်</button>
        </div>
        <div class="fb-date-grid">
          <label>စတင်ရက်
            <input id="start-${userData.id}" type="date" value="${dateInputValue(start)}">
          </label>
          <label>ကုန်ဆုံးရက်
            <input id="end-${userData.id}" type="date" value="${dateInputValue(expiry)}">
          </label>
        </div>
        <div class="fb-controls">
          <button class="grant" data-save-dates="${userData.id}">ရက်စွဲသိမ်းမည်</button>
          <button class="stop" data-stop="${userData.id}">ပိတ်မည်</button>
        </div>
      `}
    </div>`;
  }

  function bindRows() {
    document.querySelectorAll("[data-period]").forEach(button => {
      button.onclick = () => setDuration(
        button.dataset.period,
        button.dataset.unit,
        Number(button.dataset.value)
      );
    });

    document.querySelectorAll("[data-custom-months]").forEach(button => {
      button.onclick = () => {
        const uid = button.dataset.customMonths;
        const input = document.getElementById(`months-${uid}`);
        const months = Math.max(1, Math.min(120, Number(input.value) || 1));
        setDuration(uid, "months", months);
      };
    });

    document.querySelectorAll("[data-save-dates]").forEach(button => {
      button.onclick = () => saveManualDates(button.dataset.saveDates);
    });

    document.querySelectorAll("[data-stop]").forEach(button => {
      button.onclick = async () => {
        if (!confirm("ဤ Account ကို ပိတ်မည်လား?")) return;
        try {
          await updateDoc(doc(db, "users", button.dataset.stop), {
            status: "suspended",
            updatedAt: serverTimestamp(),
            updatedBy: session.user.uid
          });
          await loadUsers();
        } catch (e) {
          alert(friendly(e));
        }
      };
    });
  }

  async function setDuration(uid, unit, value) {
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Account document မရှိပါ");

      const data = snap.data();
      const originalStart =
        toDate(data.subscriptionStartAt) ||
        toDate(data.createdAt) ||
        new Date();

      const expiry = unit === "days"
        ? addDays(originalStart, value)
        : addMonths(originalStart, value);

      await updateDoc(ref, {
        status: "active",
        subscriptionStartAt: Timestamp.fromDate(originalStart),
        expiresAt: Timestamp.fromDate(expiry),
        lastGrantedValue: value,
        lastGrantedUnit: unit,
        updatedAt: serverTimestamp(),
        updatedBy: session.user.uid
      });

      await loadUsers();
      alert(
        `${unit === "days" ? `${value} ရက်` : `${value} လ`} သို့ ပြောင်းပြီးပါပြီ။\n` +
        `စတင်ရက် — ${fmt(originalStart)}\n` +
        `ကုန်ဆုံးရက် — ${fmt(expiry)}`
      );
    } catch (e) {
      alert(friendly(e));
    }
  }

  async function saveManualDates(uid) {
    const startValue = document.getElementById(`start-${uid}`)?.value;
    const endValue = document.getElementById(`end-${uid}`)?.value;

    if (!startValue || !endValue) {
      alert("စတင်ရက်နှင့် ကုန်ဆုံးရက် နှစ်ခုလုံးထည့်ပါ။");
      return;
    }

    const start = localDateStart(startValue);
    const end = localDateEnd(endValue);

    if (!start || !end || end.getTime() <= start.getTime()) {
      alert("ကုန်ဆုံးရက်သည် စတင်ရက်ထက် နောက်ကျရမည်။");
      return;
    }

    try {
      await updateDoc(doc(db, "users", uid), {
        status: "active",
        subscriptionStartAt: Timestamp.fromDate(start),
        expiresAt: Timestamp.fromDate(end),
        updatedAt: serverTimestamp(),
        updatedBy: session.user.uid
      });
      await loadUsers();
      alert(`ရက်စွဲပြင်ပြီးပါပြီ။\n${fmt(start)} မှ ${fmt(end)} အထိ`);
    } catch (e) {
      alert(friendly(e));
    }
  }
}

function isUnusedPendingAccount(data) {
  return data &&
    data.status === "pending" &&
    !data.expiresAt &&
    !data.trialStartedAt;
}

function updateAccessBadge(owner, expiry) {
  const badge = document.getElementById("accessDaysBadge");
  if (!badge) return;

  badge.classList.add("show");
  badge.classList.toggle("owner", owner);

  if (owner) {
    badge.textContent = "ပိုင်ရှင်";
    badge.title = "အမြဲတမ်းအသုံးပြုခွင့်";
    badge.classList.remove("warning");
    return;
  }

  const days = remainingDays(expiry);
  badge.textContent = `${toMyanmarDigits(days)} ရက်ကျန်`;
  badge.title = expiry ? `သက်တမ်းကုန် — ${fmt(expiry)}` : "";
  badge.classList.toggle("warning", days <= 3);
}

function hideAccessBadge() {
  const badge = document.getElementById("accessDaysBadge");
  if (badge) badge.classList.remove("show");
}

function remainingDays(expiry) {
  if (!expiry) return 0;
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / DAY_MS));
}

function toMyanmarDigits(value) {
  return String(value).replace(/\d/g, digit => "၀၁၂၃၄၅၆၇၈၉"[Number(digit)]);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonths(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

function toDate(value) {
  return value?.toDate ? value.toDate() : null;
}

function dateInputValue(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateStart(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateEnd(value) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function showGate(title, message, account, type, login, logout) {
  const gate = document.getElementById("fbGate");
  gate.classList.remove("hidden");
  document.getElementById("fbTitle").textContent = title;
  document.getElementById("fbMessage").textContent = message;
  document.getElementById("fbSpin").style.display = "none";

  const box = document.getElementById("fbAccount");
  box.style.display = account ? "block" : "none";
  box.textContent = account || "";

  const buttons = document.getElementById("fbButtons");
  buttons.innerHTML = "";

  if (type === "login") {
    const button = document.createElement("button");
    button.className = "fb-btn primary";
    button.textContent = "Google ဖြင့် Login ဝင်မည်";
    button.onclick = login;
    buttons.appendChild(button);
  } else if (type === "signed") {
    const refresh = document.createElement("button");
    refresh.className = "fb-btn primary";
    refresh.textContent = "အခြေအနေ ပြန်စစ်မည်";
    refresh.onclick = () => location.reload();

    const otherAccount = document.createElement("button");
    otherAccount.className = "fb-btn";
    otherAccount.textContent = "အခြား Gmail ဖြင့်ဝင်မည်";
    otherAccount.onclick = logout;

    buttons.append(refresh, otherAccount);
  } else {
    buttons.innerHTML = "<p style='font-size:11px'>Firebase Config ကို စစ်ဆေးပါ။</p>";
  }
}

function loading(text) {
  document.getElementById("fbGate").classList.remove("hidden");
  document.getElementById("fbTitle").textContent = "စစ်ဆေးနေသည်";
  document.getElementById("fbMessage").textContent = text;
  document.getElementById("fbSpin").style.display = "block";
  document.getElementById("fbButtons").innerHTML = "";
}

function appReady() {
  if (window.sanYinApp) return Promise.resolve();
  return new Promise(resolve => {
    window.addEventListener("sanYinAppReady", resolve, { once: true });
  });
}

function fmt(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("my-MM", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function fmtDate(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("my-MM", {
      year: "numeric", month: "short", day: "numeric"
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function friendly(error) {
  const map = {
    "auth/unauthorized-domain": "Authentication > Settings > Authorized domains ထဲ App domain ထည့်ပါ။",
    "auth/network-request-failed": "Internet ချိတ်ဆက်မှု စစ်ဆေးပါ။",
    "auth/popup-blocked": "Chrome က Login popup ကို ပိတ်ထားသည်။ Popup ခွင့်ပြုပြီး ပြန်စမ်းပါ။",
    "auth/popup-closed-by-user": "Google Account ရွေးချယ်သည့် window ကို ပိတ်လိုက်သည်။",
    "auth/cancelled-popup-request": "Login window တစ်ခု ဖွင့်ထားပြီးဖြစ်သည်။",
    "permission-denied": "Firestore Rules အသစ်ကို Publish မလုပ်ရသေးခြင်း သို့မဟုတ် OWNER_UID မှားနေခြင်း ဖြစ်နိုင်သည်။",
    "firestore/permission-denied": "Firestore Rules အသစ်ကို Publish မလုပ်ရသေးခြင်း သို့မဟုတ် OWNER_UID မှားနေခြင်း ဖြစ်နိုင်သည်။"
  };
  return map[error?.code] || error?.message || "မသိရှိရသေးသောအမှား ဖြစ်သည်။";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function attr(value) {
  return esc(value).replace(/`/g, "&#096;");
}
