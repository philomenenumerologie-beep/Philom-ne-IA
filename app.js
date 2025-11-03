/* ====== CONFIG ====== */
const API_URL = "https://TODO_BACKEND_URL/ask"; // <- TODO: remplace par ton backend
const COST_PER_MSG = 20;
const GUEST_START = 1000;
const SIGNUP_BONUS = 3000;

/* ====== STATE ====== */
let userId = "guest";
let userEmail = null;
let signedIn = false;
let tokens = GUEST_START;
let clerkReady = false;

let history = JSON.parse(localStorage.getItem("philo_history")||"[]");
if(history.length===0){
  history = [{role:"assistant", content:"Bonjour ! Je suis Philomène I.A."}];
}

/* ====== DOM ====== */
const el = s => document.querySelector(s);
const chat = el("#chat");
const msg = el("#msg");
const send = el("#send");
const plusBtn = el("#plusBtn");
const plusMenu = el("#plusMenu");
const tokensTop = el("#tokens-top");
const tokensBottom = el("#tokens-bottom");
const net = el("#net");

const burger = el("#burger");
const side = el("#sideMenu");
const closeSide = el("#closeSide");
const menuBtn = el("#menuBtn");

const journal = el("#journal");
const memoList = el("#memoList");
const openJournalBtn = el("#openJournal");
const closeJournal = el("#closeJournal");

const payball = el("#payball");
const buyTokens = el("#buyTokens");
const closePay = el("#closePay");

const authBtn = el("#authBtn");
const authSub = el("#authSub");
const signOutBtn = el("#signOut");

const themeBtn = el("#themeBtn");
const filePicker = el("#filePicker");

/* ====== TOKENS PERSISTENCE ====== */
const keyFor = id => `philo_tokens_${id}`;
const loadTokens = id => {
  const v = localStorage.getItem(keyFor(id));
  return v ? Math.max(0, parseInt(v,10)||0) : null;
};
const saveTokens = (id,val)=> localStorage.setItem(keyFor(id), String(val));
const setTokens = val => { tokens = Math.max(0,val); saveTokens(userId,tokens); renderTokens(); };
const spend = n => setTokens(tokens - n);
const renderTokens = ()=>{ tokensTop.textContent = tokens; tokensBottom.textContent = tokens; };

/* ====== UI HELPERS ====== */
const addBubble = (role,text)=>{
  const div = document.createElement("div");
  div.className = `bubble ${role==="user"?"u":"a"}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
};
const typingOn = ()=>{
  if(el(".typing")) return;
  const t = document.createElement("div");
  t.className="typing";
  t.innerHTML="<span></span><span></span><span></span>";
  chat.appendChild(t); chat.scrollTop = chat.scrollHeight;
};
const typingOff = ()=>{ const t=el(".typing"); if(t) t.remove(); };

const pushMemo = (text)=>{
  const memo = JSON.parse(localStorage.getItem("philo_memo")||"[]");
  memo.unshift({t: Date.now(), q: text.slice(0,140)});
  localStorage.setItem("philo_memo", JSON.stringify(memo.slice(0,50)));
};
const renderMemo = ()=>{
  memoList.innerHTML="";
  const memo = JSON.parse(localStorage.getItem("philo_memo")||"[]");
  memo.forEach(m=>{
    const li=document.createElement("li");
    li.textContent = new Date(m.t).toLocaleString()+" • "+m.q;
    memoList.appendChild(li);
  });
};

/* ====== SEND LOGIC ====== */
async function sendMessage(){
  const text = msg.value.trim();
  if(!text) return;
  addBubble("user", text);
  history.push({role:"user", content:text});
  localStorage.setItem("philo_history", JSON.stringify(history.slice(-40)));
  pushMemo(text);
  msg.value="";

  spend(COST_PER_MSG);
  typingOn();
  net.textContent="Connexion…";

  try{
    const r = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ conversation: history })
    });
    const data = await r.json();
    typingOff();
    net.textContent="";
    const answer = (data && data.answer) ? data.answer.trim() : "Désolée, j'ai eu un souci réseau.";
    addBubble("assistant", answer);
    history.push({role:"assistant", content:answer});
    localStorage.setItem("philo_history", JSON.stringify(history.slice(-40)));
  }catch(e){
    typingOff();
    net.textContent="Réseau indisponible. Réessaie.";
    addBubble("assistant","Désolée, j'ai eu un souci réseau.");
  }
}
send.addEventListener("click", sendMessage);
msg.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); sendMessage(); }});

/* ====== PLUS MENU / TOOLS ====== */
plusBtn.addEventListener("click", ()=> plusMenu.classList.toggle("show"));

el("#toolJournal").addEventListener("click", ()=>{
  plusMenu.classList.remove("show");
  journal.classList.add("show");
  renderMemo();
});

el("#toolPay").addEventListener("click", ()=>{
  plusMenu.classList.remove("show");
  payball.classList.remove("hidden");
});

el("#toolDoc").addEventListener("click", ()=>{
  plusMenu.classList.remove("show");
  filePicker.click();
});
filePicker.addEventListener("change", ()=>{
  if(filePicker.files && filePicker.files[0]){
    addBubble("assistant", `📄 Fichier reçu : ${filePicker.files[0].name} (non envoyé au backend dans cette démo)`);
  }
});

el("#toolPhoto").addEventListener("click", ()=>{
  plusMenu.classList.remove("show");
  const i = document.createElement("input");
  i.type="file"; i.accept="image/*"; i.capture="environment";
  i.onchange = () => {
    if(i.files && i.files[0]){
      addBubble("assistant", `📷 Photo sélectionnée : ${i.files[0].name}`);
    }
  };
  i.click();
});

/* Micro : enregistrement + transcription locale (placeholder) */
el("#toolMic").addEventListener("click", async ()=>{
  plusMenu.classList.remove("show");
  if(!navigator.mediaDevices?.getUserMedia){
    addBubble("assistant","🎤 Micro non disponible sur ce navigateur.");
    return;
  }
  addBubble("assistant","🎙️ Enregistrement (démo)… Parle 3 secondes.");
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    const chunks=[]; const rec = new MediaRecorder(stream);
    rec.ondataavailable = e=> chunks.push(e.data);
    rec.onstop = ()=>{
      stream.getTracks().forEach(t=>t.stop());
      addBubble("assistant","(Démo) Transcription locale simulée : “Bonjour Philomène.”");
    };
    rec.start();
    setTimeout(()=> rec.stop(), 3000);
  }catch(e){ addBubble("assistant","🎤 Autorisation micro refusée."); }
});

/* ====== SIDE / JOURNAL / PAY ====== */
burger.addEventListener("click", ()=> side.classList.add("show"));
menuBtn.addEventListener("click", ()=> side.classList.add("show"));
closeSide.addEventListener("click", ()=> side.classList.remove("show"));
openJournalBtn.addEventListener("click", ()=>{
  side.classList.remove("show");
  journal.classList.add("show");
  renderMemo();
});
closeJournal.addEventListener("click", ()=> journal.classList.remove("show"));

buyTokens.addEventListener("click", ()=> { side.classList.remove("show"); payball.classList.remove("hidden"); });
closePay.addEventListener("click", ()=> payball.classList.add("hidden"));
document.querySelectorAll(".pack").forEach(b=>{
  b.addEventListener("click", ()=>{
    const p = b.dataset.pack|0;
    let credit = p===5?70000:p===10?150000:320000;
    // Bonus first purchase
    const first = !localStorage.getItem("philo_has_bought");
    if(first){ credit*=2; localStorage.setItem("philo_has_bought","1"); }
    setTokens(tokens + credit);
    payball.classList.add("hidden");
    addBubble("assistant", `✅ Achat simulé : +${credit.toLocaleString("fr-FR")} tokens.`);
  });
});

/* ====== AUTH (Clerk) ====== */
async function initClerk(){
  if(!window.Clerk){ setTimeout(initClerk, 400); return; }
  try{
    await window.Clerk.load();
    clerkReady=true;
    const user = window.Clerk.user;
    const session = window.Clerk.session;

    if(user && session){
      signedIn=true;
      userId = user.id || "u";
      userEmail = user.primaryEmailAddress?.emailAddress || null;
      authBtn.querySelector(".big").textContent = "✅ Connecté";
      authSub.textContent = userEmail || "Compte actif";

      const saved = loadTokens(userId);
      if(saved!==null){ tokens=saved; }
      else{
        const guest = loadTokens("guest"); tokens = (guest ?? GUEST_START) + SIGNUP_BONUS;
        saveTokens(userId, tokens);
      }
    }else{
      signedIn=false; userId="guest"; userEmail=null;
      authBtn.querySelector(".big").textContent = "🔐 Connexion / Inscription";
      authSub.textContent = "Sécurisé";
      const saved = loadTokens("guest");
      tokens = (saved!==null? saved : GUEST_START);
      saveTokens("guest", tokens);
    }
    renderTokens();
  }catch(e){ console.warn("Clerk init err", e); }
}
authBtn.addEventListener("click", async ()=>{
  if(!clerkReady) { net.textContent="Connexion en cours… réessaie dans 1 seconde."; return; }
  if(signedIn){
    saveTokens(userId,tokens);
    await window.Clerk.signOut();
    signedIn=false; userId="guest"; userEmail=null;
    initClerk(); return;
  }
  try{
    await window.Clerk.openSignIn({
      afterSignIn: initClerk,
      afterSignUp: initClerk
    });
  }catch(e){ console.warn(e); }
});
signOutBtn.addEventListener("click", async ()=>{
  if(!signedIn) return;
  saveTokens(userId,tokens);
  await window.Clerk.signOut();
  side.classList.remove("show");
  initClerk();
});

/* ====== THEME ====== */
function setTheme(dark=true){
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("philo_theme", dark?"dark":"light");
}
themeBtn.addEventListener("click", ()=>{
  const dark = !document.body.classList.contains("dark");
  setTheme(dark);
});

/* ====== START ====== */
window.addEventListener("load", ()=>{
  // theme
  setTheme((localStorage.getItem("philo_theme")||"dark")==="dark");
  // tokens (guest default)
  const saved = loadTokens("guest");
  tokens = saved!==null? saved : GUEST_START;
  renderTokens();
  // history replay (light)
  if(history.length>1){
    chat.innerHTML="";
    history.forEach(m=> addBubble(m.role==="user"?"user":"assistant", m.content));
  }
  // clerk
  initClerk();
});
