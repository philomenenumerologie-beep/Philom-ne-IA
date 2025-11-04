/* ===== CONFIG ===== */
const API_URL = "https://api.philomeneia.com/ask";   // backend
const FALLBACK_URL = "/ask";                         // secours si API_URL vide
const VERSION = "version 1.3";                       // affiché sous le header

/* ===== Sélecteurs ===== */
const chat        = document.getElementById("chat");
const messagesBox = document.getElementById("messages");
const input       = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const plusBtn     = document.getElementById("plusBtn");
const sheet       = document.getElementById("attachSheet");
const sheetClose  = document.getElementById("closeSheet");
const pickLibrary = document.getElementById("pickLibrary");
const takePhoto   = document.getElementById("takePhoto");
const pickFile    = document.getElementById("pickFile");
const imgLibraryInput = document.getElementById("imgLibraryInput");
const imgCameraInput  = document.getElementById("imgCameraInput");
const docInput        = document.getElementById("docInput");
const micBtn     = document.getElementById("micBtn");
const tokenCountEl = document.getElementById("tokenCount");

const btnMenu    = document.getElementById("btnMenu");
const dropdown   = document.getElementById("menuDropdown");
const toggleTheme= document.getElementById("toggleTheme");
const openFaq    = document.getElementById("openFaq");
const btnLogin   = document.getElementById("btnLogin");
const btnBuy     = document.getElementById("btnBuy");

document.getElementById("appVersion").textContent = VERSION;

/* ===== I18N (FR / EN / NL) ===== */
const I18N = {
  fr: {
    welcome: "Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.",
    login: "Connexion",
    buy: "Acheter",
    menuTheme: "🌗 Mode jour / nuit",
    menuFaq: "❓ F.A.Q.",
    inputPh: "Écrivez votre message…",
    sheetTitle: "Joindre…",
    lib: "📷 Photothèque",
    cam: "📸 Prendre une photo",
    file: "🗂️ Choisir un fichier",
    close: "Fermer",
    faqTitle: "Foire aux questions",
    faqHtml: `
      <p><strong>Quelle IA utilise Philomène ?</strong><br/>
      Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>, la version la plus avancée d’OpenAI.</p>
      <p><strong>Comment fonctionnent les tokens ?</strong><br/>
      Chaque question + réponse consomme des tokens selon leur longueur. Le diamant 💎 affiche votre solde (décompte réel).</p>
      <p><strong>Packs disponibles :</strong><br/>
      💎 1 000 000 tokens → 5 €<br/>
      💎 2 000 000 tokens → 10 €<br/>
      💎 4 000 000 tokens → 20 €<br/>
      🎁 Premier achat : <strong>+50 % offerts</strong>.</p>
      <p><strong>Abonnement ?</strong><br/>Non. Vous payez uniquement ce que vous consommez.</p>
      <p><strong>Confidentialité</strong><br/>Vos échanges restent privés.</p>
    `
  },
  en: {
    welcome: "Hi 👋 I’m Philomène A.I., powered by GPT-5 Thinking.",
    login: "Sign in",
    buy: "Buy",
    menuTheme: "🌗 Light / Dark mode",
    menuFaq: "❓ FAQ",
    inputPh: "Type your message…",
    sheetTitle: "Attach…",
    lib: "📷 Photo library",
    cam: "📸 Take a photo",
    file: "🗂️ Choose a file",
    close: "Close",
    faqTitle: "Frequently Asked Questions",
    faqHtml: `
      <p><strong>Which AI powers Philomène?</strong><br/>
      Philomène A.I. is powered by <strong>GPT-5 Thinking</strong>, OpenAI’s most advanced version.</p>
      <p><strong>How do tokens work?</strong><br/>
      Each question + answer consumes a small number of tokens depending on length. The diamond 💎 shows your balance (real countdown).</p>
      <p><strong>Packs:</strong><br/>
      💎 1,000,000 tokens → €5<br/>💎 2,000,000 → €10<br/>💎 4,000,000 → €20<br/>
      🎁 First purchase: <strong>+50% bonus</strong>.</p>
      <p><strong>Subscription?</strong><br/>No. You only pay for what you use.</p>
      <p><strong>Privacy</strong><br/>Your conversations remain private.</p>
    `
  },
  nl: {
    welcome: "Hallo 👋 Ik ben Philomène A.I., aangedreven door GPT-5 Thinking.",
    login: "Inloggen",
    buy: "Kopen",
    menuTheme: "🌗 Licht / Donker",
    menuFaq: "❓ Veelgestelde vragen",
    inputPh: "Schrijf uw bericht…",
    sheetTitle: "Bijvoegen…",
    lib: "📷 Fotobibliotheek",
    cam: "📸 Foto maken",
    file: "🗂️ Bestand kiezen",
    close: "Sluiten",
    faqTitle: "Veelgestelde vragen",
    faqHtml: `
      <p><strong>Welke AI gebruikt Philomène?</strong><br/>
      Philomène A.I. draait op <strong>GPT-5 Thinking</strong>, de meest geavanceerde versie van OpenAI.</p>
      <p><strong>Hoe werken tokens?</strong><br/>
      Elke vraag + antwoord verbruikt enkele tokens afhankelijk van de lengte. De diamant 💎 toont uw saldo (echte aftelling).</p>
      <p><strong>Pakketten:</strong><br/>
      💎 1.000.000 tokens → €5<br/>💎 2.000.000 → €10<br/>💎 4.000.000 → €20<br/>
      🎁 Eerste aankoop: <strong>+50% bonus</strong>.</p>
      <p><strong>Abonnement?</strong><br/>Nee. U betaalt enkel wat u verbruikt.</p>
      <p><strong>Privacy</strong><br/>Uw gesprekken blijven privé.</p>
    `
  }
};

function detectLang(){
  const q = new URLSearchParams(location.search).get("lang");
  const ls = localStorage.getItem("lang");
  const nav = (navigator.language || "en").toLowerCase();
  const guess = nav.startsWith("fr") ? "fr" : nav.startsWith("nl") ? "nl" : "en";
  const lang = (q || ls || guess);
  localStorage.setItem("lang", lang);
  return ["fr","en","nl"].includes(lang) ? lang : "en";
}
const LANG = detectLang();
const T = I18N[LANG];

function applyI18N(){
  btnLogin.textContent = T.login;
  btnBuy.textContent   = T.buy;
  toggleTheme.textContent = T.menuTheme;
  openFaq.textContent  = T.menuFaq;
  input.placeholder = T.inputPh;
  document.querySelector(".sheet__title").textContent = T.sheetTitle;
  pickLibrary.textContent = T.lib;
  takePhoto.textContent   = T.cam;
  pickFile.textContent    = T.file;
  sheetClose.textContent  = T.close;

  // Met à jour la bulle d’accueil si elle existe déjà dans le DOM
  const firstWelcome = document.querySelector(".bubble.bot .bubble__content");
  if (firstWelcome) firstWelcome.textContent = T.welcome;
}
applyI18N();

/* ===== État conversation & tokens ===== */
const LS_USER   = "philo_user_id";
const LS_TOKENS = "philo_tokens_balance";
let userId = localStorage.getItem(LS_USER);
if (!userId) {
  userId = "guest_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(LS_USER, userId);
}
let tokenBalance = Number(localStorage.getItem(LS_TOKENS));
if (!Number.isFinite(tokenBalance)) {
  tokenBalance = 1_000_000; // défaut invité
  localStorage.setItem(LS_TOKENS, tokenBalance);
}
updateTokenUI();

const conversation = [
  { role: "assistant", content: T.welcome }
];

/* ===== Utilitaires UI ===== */
function addBubble(text, who = "bot") {
  const wrap = document.createElement("div");
  wrap.className = `bubble ${who}`;
  wrap.innerHTML = `<div class="bubble__content"></div>`;
  wrap.querySelector(".bubble__content").textContent = text;
  messagesBox.appendChild(wrap);
  requestAnimationFrame(() => (chat.scrollTop = chat.scrollHeight));
}
function setTyping(on) {
  if (on) addBubble("…", "bot");
  else {
    const kids = messagesBox.querySelectorAll(".bubble.bot .bubble__content");
    for (let i = kids.length - 1; i >= 0; i--) {
      if (kids[i].textContent === "…") { kids[i].closest(".bubble").remove(); break; }
    }
  }
}
function pop(text, title = "Info") {
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = text;
  modal.showModal();
}
document.getElementById("modalClose").onclick = () => document.getElementById("modal").close();

function updateTokenUI() {
  if (tokenCountEl) tokenCountEl.textContent = tokenBalance.toLocaleString("fr-FR");
}
function spendTokensReal(usage) {
  const used = Math.max(0, Number(usage?.total_tokens) || 0);
  if (used > 0) {
    tokenBalance = Math.max(0, tokenBalance - used);
    localStorage.setItem(LS_TOKENS, tokenBalance);
    updateTokenUI();
  }
}
function spendEstimateByText(str) {
  const est = Math.ceil((str || "").length / 4); // ~1 token ≈ 4 chars
  tokenBalance = Math.max(0, tokenBalance - est);
  localStorage.setItem(LS_TOKENS, tokenBalance);
  updateTokenUI();
}

/* ===== Menu ===== */
btnMenu.addEventListener("click", () => {
  dropdown.hidden = !dropdown.hidden;
});
document.addEventListener("click", (e) => {
  if (!dropdown.hidden) {
    const within = e.target.closest("#menuDropdown") || e.target.closest("#btnMenu");
    if (!within) dropdown.hidden = true;
  }
});
toggleTheme.addEventListener("click", () => {
  const body = document.body;
  const isLight = body.classList.toggle("theme-light");
  if (isLight) body.classList.remove("theme-dark"); else body.classList.add("theme-dark");
  dropdown.hidden = true;
});
openFaq.addEventListener("click", () => {
  dropdown.hidden = true;
  pop(T.faqHtml, T.faqTitle);
});

/* ===== Connexion / Acheter (placeholders) ===== */
btnLogin.addEventListener("click", () => pop("Connexion : lier ton compte (placeholder).", T.login));
btnBuy.addEventListener("click", () => pop("Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ (+50% au 1er achat).", T.buy));

/* ===== Sheet Joindre ===== */
function openSheet(){ sheet.hidden = false; }
function closeSheet(){ sheet.hidden = true; }
plusBtn.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);

pickLibrary.addEventListener("click", () => imgLibraryInput.click());
takePhoto.addEventListener("click",   () => imgCameraInput.click());
pickFile.addEventListener("click",    () => docInput.click());

/* ===== Image -> analyse via backend ===== */
async function uploadImageToAnalyze(file) {
  if (!file) return;
  addBubble(`${LANG==="fr"?"📎 Fichier reçu":"📎 Bestand ontvangen"} : ${file.name}`, "user");
  setTyping(true);

  // même domaine que /ask : on remplace juste le chemin
  const urlBase = (API_URL || FALLBACK_URL);
  const url = urlBase.includes("/ask") ? urlBase.replace("/ask","/analyze-image") : urlBase + "/analyze-image";

  const fd = new FormData();
  fd.append("image", file);
  fd.append("userId", userId);
  fd.append("prompt", LANG==="fr" ? "Analyse cette image."
                                 : LANG==="nl" ? "Analyseer deze afbeelding."
                                               : "Analyze this image.");

  try {
    const resp = await fetch(url, { method: "POST", body: fd });
    const data = await resp.json();

    setTyping(false);
    const answer = data?.answer
      || (LANG==="fr"?"Je n’ai rien détecté."
          :LANG==="nl"?"Niets gedetecteerd."
          :"Nothing detected.");
    addBubble(answer, "bot");

    // si le backend renvoie usage pour la vision
    if (data?.usage?.total_tokens) spendTokensReal(data.usage);
  } catch (e) {
    setTyping(false);
    addBubble(LANG==="fr"?"Erreur d’analyse d’image."
             :LANG==="nl"?"Fout bij afbeeldingsanalyse."
             :"Image analysis error.", "bot");
    console.error(e);
  }
}

/* Remplace l'ancien handler: on envoie l'image au backend */
function handlePickedFile(file){
  if (!file) return;
  uploadImageToAnalyze(file);
}

imgLibraryInput.onchange = (e) => handlePickedFile(e.target.files?.[0]);
imgCameraInput.onchange  = (e) => handlePickedFile(e.target.files?.[0]);
docInput.onchange        = (e) => handlePickedFile(e.target.files?.[0]);

/* ===== Micro (Web Speech API si dispo) ===== */
let recognition = null;
if ("webkitSpeechRecognition" in window) {
  const R = window.webkitSpeechRecognition;
  recognition = new R();
  recognition.lang = LANG === "nl" ? "nl-NL" : LANG === "en" ? "en-US" : "fr-FR";
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const txt = e.results[0][0].transcript;
    input.value = txt;
  };
}
micBtn.addEventListener("click", () => {
  if (recognition) recognition.start();
  else pop(LANG==="fr"?"Le micro n’est pas supporté par ce navigateur."
          :LANG==="nl"?"Microfoon niet ondersteund door deze browser."
          :"Micro is not supported by this browser.",
          "Micro");
});

/* ===== Envoi message (décompte réel) ===== */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addBubble(text, "user");
  input.value = "";
  setTyping(true);

  conversation.push({ role: "user", content: text });

  const url = API_URL || FALLBACK_URL;

  try {
    let data;

    if (url === FALLBACK_URL) {
      await new Promise((r) => setTimeout(r, 400));
      data = { answer: LANG==="fr"?"Bien reçu. Pose-moi la suite !":LANG==="nl"?"Begrepen. Stel je volgende vraag!":"Got it. Ask me more!", usage: { total_tokens: Math.ceil(text.length / 4) + 20 } };
    } else {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, conversation })
      });
      data = await resp.json();
    }

    setTyping(false);

    const answer = data?.answer || data?.output || data?.text || (LANG==="fr"?"Réponse vide.":LANG==="nl"?"Leeg antwoord.":"Empty response.");
    addBubble(answer, "bot");

    if (data?.usage && typeof data.usage.total_tokens === "number") {
      spendTokensReal(data.usage);
    } else {
      spendEstimateByText(text);
      spendEstimateByText(answer);
    }

    conversation.push({ role: "assistant", content: answer });
  } catch (e) {
    setTyping(false);
    addBubble(LANG==="fr"?"Erreur de connexion. Réessaie plus tard."
              :LANG==="nl"?"Verbindingsfout. Probeer later opnieuw."
              :"Connection error. Please try again later.", "bot");
    console.error(e);
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
});
/* ===== PAYPAL STANDARD (client-only) ===== */
const payModal = document.getElementById("payModal");
const payClose = document.getElementById("payClose");
let chosenPack = 5; // 5 | 10 | 20  (euros)

btnBuy.onclick = () => {
  payModal.showModal();
  renderPayPal(chosenPack);
};
payClose.onclick = () => payModal.close();

// Sélection pack
document.addEventListener("click", (e) => {
  const b = e.target.closest(".packsRow .pill");
  if (!b) return;
  chosenPack = Number(b.dataset.pack);
  renderPayPal(chosenPack);
});

// Charge SDK si besoin et rend les boutons
async function renderPayPal(pack){
  // 1) Charger le SDK une seule fois
  if(!document.getElementById("paypal-sdk")){
    const s = document.createElement("script");
    s.id = "paypal-sdk";
    // ⚠️ Remplace __TON_CLIENT_ID__ par ton vrai client-id PayPal (mode sandbox d'abord)
    s.src = "https://www.paypal.com/sdk/js?client-id=__TON_CLIENT_ID__&currency=EUR";
    document.body.appendChild(s);
    await new Promise(r => s.onload = r);
  }

  // 2) Calcul du montant en EUR
  const amount = pack === 5 ? "5.00" : pack === 10 ? "10.00" : "20.00";

  // 3) (Ré)initialiser le conteneur
  const box = document.getElementById("paypal-buttons");
  box.innerHTML = "";

  // 4) Boutons standard (create/capture côté client)
  window.paypal.Buttons({
    style: { layout: "horizontal", height: 45 },

    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{ amount: { currency_code: "EUR", value: amount } }]
      });
    },

    onApprove: async (data, actions) => {
      try{
        const details = await actions.order.capture();
        // Crédit local des tokens (source de vérité = backend à brancher plus tard)
        const baseTokens = pack === 5 ? 1_000_000 : pack === 10 ? 2_000_000 : 4_000_000;

        // Bonus 50% pour tout premier achat (flag local)
        const FIRST_FLAG = "philo_first_purchase_done";
        const isFirst = !localStorage.getItem(FIRST_FLAG);
        const bonus = isFirst ? Math.floor(baseTokens * 0.5) : 0;
        if(isFirst) localStorage.setItem(FIRST_FLAG, "1");

        const credited = baseTokens + bonus;
        tokenBalance += credited;
        localStorage.setItem(LS_TOKENS, tokenBalance);
        updateTokenUI();

        addBubble(
          LANG==="fr"
            ? `✅ Paiement confirmé (${amount}€). +${credited.toLocaleString("fr-FR")} tokens crédités.`
            : LANG==="nl"
              ? `✅ Betaling bevestigd (${amount}€). +${credited.toLocaleString("fr-FR")} tokens toegevoegd.`
              : `✅ Payment confirmed (€${amount}). +${credited.toLocaleString("fr-FR")} tokens added.`,
          "bot"
        );
        payModal.close();
      }catch(err){
        console.error(err);
        addBubble(LANG==="fr"?"❌ Erreur lors de la capture du paiement."
                 :LANG==="nl"?"❌ Fout bij betalingsverwerking."
                 :"❌ Payment capture error.", "bot");
      }
    },

    onError: (err) => {
      console.error(err);
      addBubble(LANG==="fr"?"❌ Paiement refusé/annulé."
               :LANG==="nl"?"❌ Betaling geweigerd/geannuleerd."
               :"❌ Payment failed/cancelled.", "bot");
    }
  }).render("#paypal-buttons");
}

/* ===== Auto-scroll: garde le bas visible ===== */
const io = new IntersectionObserver(() => { chat.scrollTop = chat.scrollHeight; });
io.observe(document.getElementById("composer"));
