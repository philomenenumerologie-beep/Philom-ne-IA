/* =========================
   Philomène I.A. — scripts.js (clean + mémoire + clear + PayPal dynamique)
   ========================= */

/* ====== CONFIG ====== */
const API_URL = "https://api.philomeneia.com/ask";
const FALLBACK_URL = "/ask";
const VERSION = "version 1.3";

/* IMPORTANT : /config doit venir du même backend que /ask */
const API_BASE = API_URL.replace(/\/ask$/, "");
const PUBLIC_CONFIG_URL = `${API_BASE}/config`;

/* ====== DOM ====== */
const chat         = document.getElementById("chat");
const messagesBox  = document.getElementById("messages");
const input        = document.getElementById("userInput");
const sendBtn      = document.getElementById("sendBtn");
const plusBtn      = document.getElementById("plusBtn");
const sheet        = document.getElementById("attachSheet");
const sheetClose   = document.getElementById("closeSheet");
const pickLibrary  = document.getElementById("pickLibrary");
const takePhoto    = document.getElementById("takePhoto");
const pickFile     = document.getElementById("pickFile");
const imgLibraryInput = document.getElementById("imgLibraryInput");
const imgCameraInput  = document.getElementById("imgCameraInput");
const docInput        = document.getElementById("docInput");
const micBtn       = document.getElementById("micBtn");
const tokenCountEl = document.getElementById("tokenCount");
const btnMenu      = document.getElementById("btnMenu");
const dropdown     = document.getElementById("menuDropdown");
const toggleTheme  = document.getElementById("toggleTheme");
const openFaq      = document.getElementById("openFaq");
const btnLogin     = document.getElementById("btnLogin");
const btnBuy       = document.getElementById("btnBuy");
document.getElementById("appVersion").textContent = VERSION;

/* ====== PACKS (NOUVELLES VALEURS) ====== */
const PACKS = {
  5:  { amount: "5.00",  tokens: 500_000 },
  10: { amount: "10.00", tokens: 1_200_000 },
  20: { amount: "20.00", tokens: 3_000_000 }
};

/* ====== I18N ====== */
const I18N = {
  fr: {
    welcome: "Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.",
    login: "Connexion", logout: "Déconnexion", buy: "Acheter",
    menuTheme: "🌗 Mode jour / nuit", menuFaq: "❓ F.A.Q.",
    menuClear: "🧹 Effacer l’historique",
    inputPh: "Écrivez votre message…", sheetTitle: "Joindre…",
    lib: "📷 Photothèque", cam: "📸 Prendre une photo", file: "🗂️ Choisir un fichier", close: "Fermer",
    faqTitle: "Foire aux questions",
    confirmClear: "Effacer tout l’historique de chat ? (les tokens restent inchangés)",
    faqHtml: `
      <p><strong>Quelle IA utilise Philomène ?</strong><br/>Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Comment fonctionnent les tokens ?</strong><br/>Chaque question + réponse consomment des tokens selon leur longueur. Le diamant 💎 affiche votre solde.</p>
      <p><strong>Packs disponibles :</strong><br/>
        💎 <strong>500 000</strong> tokens → <strong>5 €</strong><br/>
        💎 <strong>1 200 000</strong> tokens → <strong>10 €</strong><br/>
        💎 <strong>3 000 000</strong> tokens → <strong>20 €</strong><br/>
        🎁 <strong>Premier achat : +50 % offerts</strong>.
      </p>
      <p><strong>Abonnement ?</strong> Non.</p>
      <p><strong>Confidentialité :</strong> vos échanges restent privés.</p>`
  },
  en: {
    welcome: "Hi 👋 I’m Philomène A.I., powered by GPT-5 Thinking.",
    login: "Sign in", logout: "Sign out", buy: "Buy",
    menuTheme: "🌗 Light / Dark mode", menuFaq: "❓ FAQ",
    menuClear: "🧹 Clear history",
    inputPh: "Type your message…", sheetTitle: "Attach…",
    faqTitle: "Frequently Asked Questions",
    confirmClear: "Clear all chat history? (tokens stay unchanged)",
    faqHtml: `
      <p><strong>Which AI?</strong> <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Tokens:</strong> Q+A consume tokens. 💎 shows your balance.</p>
      <p><strong>Packs:</strong><br/>
        💎 <strong>500,000</strong> tokens → <strong>€5</strong><br/>
        💎 <strong>1,200,000</strong> tokens → <strong>€10</strong><br/>
        💎 <strong>3,000,000</strong> tokens → <strong>€20</strong><br/>
        🎁 <strong>First purchase: +50% bonus</strong>.
      </p>
      <p><strong>Subscription?</strong> No.</p>
      <p><strong>Privacy:</strong> your chats stay private.</p>`
  },
  nl: {
    welcome: "Hallo 👋 Ik ben Philomène A.I., aangedreven door GPT-5 Thinking.",
    login: "Inloggen", logout: "Uitloggen", buy: "Kopen",
    menuTheme: "🌗 Licht / Donker", menuFaq: "❓ Veelgestelde vragen",
    menuClear: "🧹 Geschiedenis wissen",
    inputPh: "Schrijf uw bericht…", sheetTitle: "Bijvoegen…",
    faqTitle: "Veelgestelde vragen",
    confirmClear: "Alle chatgeschiedenis wissen? (tokens blijven ongewijzigd)",
    faqHtml: `
      <p><strong>Welke AI?</strong> <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Tokens:</strong> vraag + antwoord verbruiken tokens. 💎 toont saldo.</p>
      <p><strong>Pakketten:</strong><br/>
        💎 <strong>500.000</strong> tokens → <strong>€5</strong><br/>
        💎 <strong>1.200.000</strong> tokens → <strong>€10</strong><br/>
        💎 <strong>3.000.000</strong> tokens → <strong>€20</strong><br/>
        🎁 <strong>Eerste aankoop: +50% bonus</strong>.
      </p>
      <p><strong>Abonnement?</strong> Nee.</p>
      <p><strong>Privacy:</strong> gesprekken blijven privé.</p>`
  }
};

function detectLang() {
  const q  = new URLSearchParams(location.search).get("lang");
  const ls = localStorage.getItem("lang");
  const nav = (navigator.language || "en").toLowerCase();
  const guess = nav.startsWith("fr") ? "fr" : nav.startsWith("nl") ? "nl" : "en";
  const lang = q || ls || guess;
  localStorage.setItem("lang", lang);
  return ["fr","en","nl"].includes(lang) ? lang : "en";
}
const LANG = detectLang();
const T = I18N[LANG];

/* ====== ÉTAT & TOKENS & MÉMOIRE ====== */
const LS_USER   = "philo_user_id";
const LS_TOKENS = "philo_tokens_balance";
const LS_SIGNUP_BONUS = "philo_signup_bonus_claimed_by_user";
const LS_CONV  = "philo_conversation";
const MAX_CONV = 100;

// user id
let userId = localStorage.getItem(LS_USER);
if (!userId) {
  userId = "guest_" + Math.random().toString(36).slice(2,10);
  localStorage.setItem(LS_USER, userId);
}

// tokens (2000 invités au premier accès)
let tokenBalance = Number(localStorage.getItem(LS_TOKENS));
if (!Number.isFinite(tokenBalance)) {
  tokenBalance = 2000;
  localStorage.setItem(LS_TOKENS, tokenBalance);
}
updateTokenUI();

// conversation : charge depuis mémoire si dispo
function safeParse(json, fallback){ try { return JSON.parse(json); } catch { return fallback; } }
let conversation = safeParse(localStorage.getItem(LS_CONV), []);
if (!Array.isArray(conversation) || conversation.length === 0) {
  conversation = [{ role: "assistant", content: T.welcome }];
  saveConversation();
}

// si historique présent, on enlève la bulle statique du HTML et on rend tout
(function initialRender(){
  if (conversation && conversation.length > 0) {
    const staticWelcome = document.querySelector("#chat > .bubble.bot");
    if (staticWelcome) staticWelcome.remove();
    messagesBox.innerHTML = "";
    renderConversation(conversation);
  }
})();

/* ====== I18N → texte UI ====== */
(function applyI18N(){
  btnLogin.textContent = T.login;
  btnBuy.textContent   = T.buy;
  toggleTheme.textContent = T.menuTheme;
  openFaq.textContent  = T.menuFaq;
  input.placeholder    = T.inputPh;
  document.querySelector(".sheet__title").textContent = T.sheetTitle;
  pickLibrary.textContent = T.lib; takePhoto.textContent = T.cam;
  pickFile.textContent    = T.file; sheetClose.textContent = T.close;

  const clearBtn = document.createElement("button");
  clearBtn.id = "clearHistory";
  clearBtn.className = "dropdown__item";
  clearBtn.textContent = T.menuClear;
  dropdown.appendChild(clearBtn);
  clearBtn.addEventListener("click", handleClearHistory);
})();

/* ====== HELPERS ====== */
function saveConversation() {
  const trimmed = conversation.slice(-MAX_CONV);
  localStorage.setItem(LS_CONV, JSON.stringify(trimmed));
}
function renderConversation(list){
  for (const m of list) addBubble(m.content, m.role === "user" ? "user" : "bot");
}
function addBubble(text, who="bot"){
  const wrap = document.createElement("div");
  wrap.className = `bubble ${who}`;
  wrap.innerHTML = `<div class="bubble__content"></div>`;
  wrap.querySelector(".bubble__content").textContent = text;
  messagesBox.appendChild(wrap);
  requestAnimationFrame(()=> (chat.scrollTop = chat.scrollHeight));
}
function setTyping(on){
  if(on){ addBubble("…","bot"); return; }
  const kids = messagesBox.querySelectorAll(".bubble.bot .bubble__content");
  for(let i=kids.length-1;i>=0;i--){
    if(kids[i].textContent==="…"){ kids[i].closest(".bubble").remove(); break; }
  }
}
function pop(html, title="Info"){
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  modal.showModal();
}
document.getElementById("modalClose").onclick = () => document.getElementById("modal").close();

function updateTokenUI(){ if(tokenCountEl) tokenCountEl.textContent = tokenBalance.toLocaleString("fr-FR"); }
function spendTokensReal(usage){
  const used = Math.max(0, Number(usage?.total_tokens)||0);
  if(used>0){ tokenBalance = Math.max(0, tokenBalance - used); localStorage.setItem(LS_TOKENS, tokenBalance); updateTokenUI(); }
}
function spendEstimateByText(str){
  const est = Math.ceil((str||"").length/4);
  tokenBalance = Math.max(0, tokenBalance - est);
  localStorage.setItem(LS_TOKENS, tokenBalance);
  updateTokenUI();
}

/* ====== Effacer l’historique ====== */
function handleClearHistory(){
  const msg = T.confirmClear || "Clear history?";
  if (!confirm(msg)) return;
  resetConversationUI();
}

/* ====== MENU ====== */
btnMenu.addEventListener("click",()=> dropdown.hidden = !dropdown.hidden);
document.addEventListener("click",(e)=>{
  if(!dropdown.hidden){
    const w = e.target.closest("#menuDropdown") || e.target.closest("#btnMenu");
    if(!w) dropdown.hidden = true;
  }
});
toggleTheme.addEventListener("click",()=>{
  const b=document.body;
  const isLight=b.classList.toggle("theme-light");
  if(isLight) b.classList.remove("theme-dark"); else b.classList.add("theme-dark");
  dropdown.hidden=true;
});
openFaq.addEventListener("click",()=>{ dropdown.hidden=true; pop(T.faqHtml, T.faqTitle); });

/* ====== SHEET JOINDRE ====== */
const openSheet  = () => (sheet.hidden = false);
const closeSheet = () => (sheet.hidden = true);
plusBtn.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);
pickLibrary.addEventListener("click", ()=> imgLibraryInput.click());
takePhoto  .addEventListener("click", ()=> imgCameraInput.click());
pickFile   .addEventListener("click", ()=> docInput.click());

/* ====== UPLOAD IMAGE ====== */
async function uploadImageToAnalyze(file){
  if(!file) return;
  addBubble(`${LANG==="fr"?"📎 Fichier reçu":LANG==="nl"?"📎 Bestand ontvangen":"📎 File received"} : ${file.name}`,"user");
  setTyping(true);
  const urlBase = API_URL || FALLBACK_URL;
  const url = urlBase.includes("/ask") ? urlBase.replace("/ask","/analyze-image") : urlBase + "/analyze-image";
  const fd = new FormData();
  fd.append("image", file);
  fd.append("userId", userId);
  fd.append("prompt", LANG==="fr"?"Analyse cette image.":LANG==="nl"?"Analyseer deze afbeelding.":"Analyze this image.");
  try{
    const resp = await fetch(url,{ method:"POST", body:fd });
    const data = await resp.json();
    setTyping(false);
    const answer = data?.answer || (LANG==="fr"?"Je n’ai rien détecté.":LANG==="nl"?"Niets gedetecteerd.":"Nothing detected.");
    addBubble(answer,"bot");
    if(data?.usage?.total_tokens) spendTokensReal(data.usage);
    conversation.push({ role:"assistant", content: answer }); saveConversation();
  }catch(e){
    setTyping(false);
    addBubble(LANG==="fr"?"Erreur d’analyse d’image.":LANG==="nl"?"Fout bij afbeeldingsanalyse.":"Image analysis error.","bot");
  }
}
imgLibraryInput.onchange = e=> uploadImageToAnalyze(e.target.files?.[0]);
imgCameraInput .onchange = e=> uploadImageToAnalyze(e.target.files?.[0]);
docInput       .onchange = e=> uploadImageToAnalyze(e.target.files?.[0]);

/* ====== MICRO ====== */
let recognition = null;
if("webkitSpeechRecognition" in window){
  const R = window.webkitSpeechRecognition;
  recognition = new R();
  recognition.lang = LANG==="nl"?"nl-NL":LANG==="en"?"en-US":"fr-FR";
  recognition.interimResults = false;
  recognition.onresult = (e)=>{ input.value = e.results[0][0].transcript; };
}
micBtn.addEventListener("click", ()=> recognition ? recognition.start() :
  pop(LANG==="fr"?"Le micro n’est pas supporté par ce navigateur.":LANG==="nl"?"Microfoon niet ondersteund door deze browser.":"Micro is not supported by this browser.","Micro")
);

/* ====== CHAT ====== */
async function openPayUI(){
  payModal.showModal();
  refreshPackButtonsLabels?.();
  await configReady;              // on attend la config avant d’essayer PayPal
  if(!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "__TON_CLIENT_ID__"){
    addBubble(LANG==="fr"
      ? "⚠️ Paiement indisponible : identifiant PayPal absent côté serveur (/config)."
      : LANG==="nl"
      ? "⚠️ Betaling niet beschikbaar: PayPal-ID ontbreekt (/config)."
      : "⚠️ Payment unavailable: missing PayPal client ID from /config.", "bot");
    return;
  }
  renderPayPal(chosenPack);
}

async function sendMessage(){
  const text = input.value.trim();
  if(!text) return;

  // si plus de tokens : on ouvre la modale d’achat
  if (tokenBalance <= 0) {
    openPayUI();
    return;
  }

  addBubble(text,"user");
  conversation.push({ role:"user", content:text }); saveConversation();

  input.value=""; setTyping(true);
  const url = API_URL || FALLBACK_URL;
  try{
    let data;
    if(url===FALLBACK_URL){
      await new Promise(r=>setTimeout(r,400));
      data = { answer: LANG==="fr"?"Bien reçu. Pose-moi la suite !":LANG==="nl"?"Begrepen. Stel je volgende vraag!":"Got it. Ask me more!", usage:{ total_tokens: Math.ceil(text.length/4)+20 } };
    }else{
      const resp = await fetch(url,{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ userId, conversation }) });
      data = await resp.json();
    }
    setTyping(false);
    const answer = data?.answer || data?.output || data?.text || (LANG==="fr"?"Réponse vide.":LANG==="nl"?"Leeg antwoord.":"Empty response.");
    addBubble(answer,"bot");
    if(data?.usage && typeof data.usage.total_tokens==="number") spendTokensReal(data.usage);
    else { spendEstimateByText(text); spendEstimateByText(answer); }

    conversation.push({ role:"assistant", content:answer }); saveConversation();
  }catch(e){
    setTyping(false);
    addBubble(LANG==="fr"?"Erreur de connexion. Réessaie plus tard.":LANG==="nl"?"Verbindingsfout. Probeer later opnieuw.":"Connection error. Please try again later.","bot");
  }
}
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); sendMessage(); }});

/* ====== PAYPAL (dynamique) ====== */
const payModal = document.getElementById("payModal");
const payClose = document.getElementById("payClose");
let chosenPack = 5;

let PAYMENTS_ENABLED = true;         // défaut : on suppose actif (pour compat)
let PAYPAL_CLIENT_ID = "__TON_CLIENT_ID__"; // remplacé via /config

function refreshPackButtonsLabels(){
  const container = document.querySelector(".packsRow");
  if (!container) return;
  container.querySelectorAll(".pill[data-pack]").forEach(btn=>{
    const val = Number(btn.dataset.pack);
    const cfg = PACKS[val];
    if (!cfg) return;
    const formatted = cfg.tokens.toLocaleString(LANG==="fr"?"fr-FR":LANG==="nl"?"nl-NL":"en-US");
    btn.textContent = `${val}€ • ${formatted}`;
  });
}

/* — Attente de la config — */
let _resolveConfig;
const configReady = new Promise(r => (_resolveConfig = r));

(async function initPaymentsConfig(){
  try{
    const r = await fetch(PUBLIC_CONFIG_URL, { method:"GET", cache:"no-store" });
    if(r.ok){
      const cfg = await r.json();
      if(typeof cfg.paymentsEnabled === "boolean") PAYMENTS_ENABLED = cfg.paymentsEnabled;
      if(cfg.paypalClientId) PAYPAL_CLIENT_ID = String(cfg.paypalClientId).trim().replace(/\s+/g,"");
    }
  }catch(_){}
  if(!PAYMENTS_ENABLED && btnBuy){ btnBuy.style.display = "none"; }
  _resolveConfig(true);
})();

if(btnBuy && payModal){
  btnBuy.onclick = ()=> openPayUI();
  payClose.onclick = ()=> payModal.close();
  document.addEventListener("click",(e)=>{
    const b=e.target.closest(".packsRow .pill"); if(!b) return;
    chosenPack=Number(b.dataset.pack);
    renderPayPal(chosenPack);
  });
}

async function ensurePayPalSDK(){
  // déjà présent ?
  if (window.paypal) return;

  // retire un ancien script potentiellement cassé
  document.querySelectorAll('script#paypal-sdk,script[src*="paypal.com/sdk/js"]').forEach(s => s.remove());

  // injecte proprement
  if (!PAYPAL_CLIENT_ID) throw new Error("ClientId PayPal manquant");
  const s = document.createElement("script");
  s.id = "paypal-sdk";
  s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=EUR&intent=capture&components=buttons`;
  s.async = true;

  const loaded = new Promise((resolve, reject) => {
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Échec de chargement du SDK PayPal"));
  });
  document.head.appendChild(s);
  await loaded;

  // garde-fou (exposition de window.paypal)
  for (let i=0;i<20 && !window.paypal;i++) {
    await new Promise(r => setTimeout(r, 50));
  }
  if (!window.paypal) throw new Error("PayPal SDK indisponible après onload");
}

async function renderPayPal(pack){
  if(!PAYMENTS_ENABLED) return;
  if(!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "__TON_CLIENT_ID__") return;

  try{
    await ensurePayPalSDK();
  }catch(e){
    addBubble(LANG==="fr"?"❌ Impossible de charger PayPal SDK.":"❌ Unable to load PayPal SDK.","bot");
    console.error(e);
    return;
  }

  const amount = PACKS[pack]?.amount || "5.00";
  const box=document.getElementById("paypal-buttons");
  if(!box) return;
  box.innerHTML="";

  try {
    window.paypal.Buttons({
      style:{ layout:"horizontal", height:45 },
      createOrder:(data,actions)=> actions.order.create({
        purchase_units:[{ amount:{ currency_code:"EUR", value:amount } }]
      }),
      onApprove: async (data,actions)=>{
        try{
          await actions.order.capture();

          const baseTokens = PACKS[pack]?.tokens || 500_000;
          const FIRST_FLAG="philo_first_purchase_done";
          const isFirst=!localStorage.getItem(FIRST_FLAG);
          const bonus=isFirst?Math.floor(baseTokens*0.5):0; // +50% 1er achat
          if(isFirst) localStorage.setItem(FIRST_FLAG,"1");

          const credited=baseTokens+bonus;
          tokenBalance += credited;
          localStorage.setItem(LS_TOKENS, tokenBalance);
          updateTokenUI();

          addBubble(
            LANG==="fr"
              ? `✅ Paiement confirmé (€${amount}). +${credited.toLocaleString("fr-FR")} tokens crédités${isFirst?" (+50% 1er achat)":""}.`
              : LANG==="nl"
                ? `✅ Betaling bevestigd (€${amount}). +${credited.toLocaleString("fr-FR")} tokens toegevoegd${isFirst?" (+50% eerste aankoop)":""}.`
                : `✅ Payment confirmed (€${amount}). +${credited.toLocaleString("fr-FR")} tokens added${isFirst?" (+50% first purchase)":""}.`
            ,"bot"
          );

          payModal.close();
        }catch(err){
          console.error(err);
          addBubble(
            LANG==="fr"?"❌ Erreur lors de la capture du paiement."
            :LANG==="nl"?"❌ Fout bij betalingsverwerking."
            :"❌ Payment capture error.",
            "bot"
          );
        }
      },
      onError: (err)=> {
        console.error("PayPal onError:", err);
        addBubble(
          LANG==="fr"?"❌ Paiement refusé/annulé."
          :LANG==="nl"?"❌ Betaling geweigerd/geannuleerd."
          :"❌ Payment failed/cancelled.",
          "bot"
        );
      }
    }).render("#paypal-buttons");
  } catch (err) {
    console.error("PayPal render error:", err);
    addBubble("❌ PayPal : erreur d’affichage des boutons.", "bot");
  }
}

/* ====== CLERK (auth + bonus + reset historique) ====== */
function giveSigninBonusFor(uid){
  const key = `${LS_SIGNUP_BONUS}:${uid}`;
  if(!localStorage.getItem(key)){
    const bonus = 3000; // +3000 une seule fois par userId
    tokenBalance += bonus;
    localStorage.setItem(LS_TOKENS, tokenBalance);
    localStorage.setItem(key,"1");
    updateTokenUI();
    addBubble(`🎉 +${bonus.toLocaleString("fr-FR")} tokens offerts (inscription)`, "bot");
  }
}
function resetConversationUI(){
  conversation = [{ role:"assistant", content: T.welcome }];
  messagesBox.innerHTML = "";
  addBubble(T.welcome, "bot");
  saveConversation();
}
function switchUser(newId){
  const prev = localStorage.getItem(LS_USER);
  if (prev !== newId) {
    localStorage.setItem(LS_USER, newId);
    resetConversationUI(); // repart sur un chat propre
  }
}
async function initClerkOnce(timeoutMs=15000){
  const start = Date.now();
  while(Date.now()-start < timeoutMs){
    if(window.Clerk){
      try{ await window.Clerk.load(); return true; }catch{}
    }
    await new Promise(r=> setTimeout(r, 200));
  }
  return false;
}
(async()=>{
  const ok = await initClerkOnce();

  if(ok){
    Clerk.addListener(({ user, session })=>{
      btnLogin.textContent = (user && session) ? T.logout : T.login;
    });
    const { user, session } = Clerk;
    btnLogin.textContent = (user && session) ? T.logout : T.login;
  }

  btnLogin.addEventListener("click", async ()=>{
    if(!window.Clerk || !window.Clerk.loaded){
      const ready = await initClerkOnce();
      if(!ready){
        pop(LANG==="fr"?"Connexion momentanément indisponible. Réessaie dans quelques secondes."
            :LANG==="nl"?"Inloggen tijdelijk niet beschikbaar. Probeer zo meteen opnieuw."
            :"Sign-in temporarily unavailable. Please try again shortly.", "Connexion");
        return;
      }
    }

    const { user, session } = Clerk;

    if(user && session){
      await Clerk.signOut();
      // repasse en invité et remet un chat propre
      const guest = "guest_" + Math.random().toString(36).slice(2,10);
      switchUser(guest);
      addBubble("👋 Déconnecté.", "bot");
      btnLogin.textContent = T.login;
      return;
    }

    await Clerk.openSignIn({
      afterSignUp: async ()=>{
        await initClerkOnce();
        const u = Clerk.user;
        if(u?.id){
          switchUser(u.id);       // reset conv si changement de compte
          giveSigninBonusFor(u.id);
        }
        addBubble("✅ Inscription réussie", "bot");
        btnLogin.textContent = T.logout;
      },
      afterSignIn: async ()=>{
        await initClerkOnce();
        const u = Clerk.user;
        if(u?.id){
          switchUser(u.id);       // reset conv si changement de compte
          giveSigninBonusFor(u.id);
        }
        addBubble("✅ Connexion réussie", "bot");
        btnLogin.textContent = T.logout;
      }
    });
  });
})();

/* ====== AUTO-SCROLL ====== */
const io = new IntersectionObserver(()=>{ chat.scrollTop = chat.scrollHeight; });
io.observe(document.getElementById("composer"));
