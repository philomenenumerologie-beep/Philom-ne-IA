/* =========================
   Philomène I.A. — scripts.js
   version 1.3 (avec calcul tokens amélioré)
   ========================= */

/* ====== CONFIG ====== */
const API_URL = "https://api.philomeneia.com/ask";
const FALLBACK_URL = "/ask";
const VERSION = "version 1.3";

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

/* ====== I18N ====== */
const I18N = {
  fr: {
    welcome: "Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.",
    login: "Connexion",
    logout: "Déconnexion",
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
      <p><strong>Quelle IA utilise Philomène ?</strong><br/>Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Comment fonctionnent les tokens ?</strong><br/>Chaque question + réponse consomment des tokens selon leur longueur. Le diamant 💎 affiche votre solde.</p>
      <p><strong>Packs disponibles :</strong><br/>💎 1 000 000 → 5 €<br/>💎 2 000 000 → 10 €<br/>💎 4 000 000 → 20 €<br/>🎁 Premier achat : <strong>+50 %</strong>.</p>
      <p><strong>Abonnement ?</strong> Non.</p>
      <p><strong>Confidentialité :</strong> vos échanges restent privés.</p>`
  },
  en: {
    welcome: "Hi 👋 I’m Philomène A.I., powered by GPT-5 Thinking.",
    login: "Sign in",
    logout: "Sign out",
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
      <p><strong>Which AI?</strong> <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Tokens:</strong> Q+A consume tokens. 💎 shows your balance.</p>
      <p><strong>Packs:</strong> 1,000,000 → €5 • 2,000,000 → €10 • 4,000,000 → €20 • 🎁 First purchase: <strong>+50%</strong>.</p>
      <p><strong>Subscription?</strong> No.</p>
      <p><strong>Privacy:</strong> your chats stay private.</p>`
  },
  nl: {
    welcome: "Hallo 👋 Ik ben Philomène A.I., aangedreven door GPT-5 Thinking.",
    login: "Inloggen",
    logout: "Uitloggen",
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
      <p><strong>Welke AI?</strong> <strong>GPT-5 Thinking</strong>.</p>
      <p><strong>Tokens:</strong> vraag + antwoord verbruiken tokens. 💎 toont saldo.</p>
      <p><strong>Pakketten:</strong> 1.000.000 → €5 • 2.000.000 → €10 • 4.000.000 → €20 • 🎁 Eerste aankoop: <strong>+50%</strong>.</p>
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

(function applyI18N(){
  btnLogin.textContent = T.login;
  btnBuy.textContent   = T.buy;
  toggleTheme.textContent = T.menuTheme;
  openFaq.textContent = T.menuFaq;
  input.placeholder   = T.inputPh;
  document.querySelector(".sheet__title").textContent = T.sheetTitle;
  pickLibrary.textContent = T.lib;
  takePhoto.textContent   = T.cam;
  pickFile.textContent    = T.file;
  sheetClose.textContent  = T.close;
  const firstWelcome = document.querySelector(".bubble.bot .bubble__content");
  if (firstWelcome) firstWelcome.textContent = T.welcome;
})();

/* ====== ÉTAT & TOKENS ====== */
const LS_USER   = "philo_user_id";
const LS_TOKENS = "philo_tokens_balance";

let userId = localStorage.getItem(LS_USER);
if (!userId) {
  userId = "guest_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(LS_USER, userId);
}

let tokenBalance = Number(localStorage.getItem(LS_TOKENS));
if (!Number.isFinite(tokenBalance)) {
  tokenBalance = 2000;
  localStorage.setItem(LS_TOKENS, tokenBalance);
}
updateTokenUI();

const conversation = [{ role: "assistant", content: T.welcome }];

/* ====== UI HELPERS ====== */
function addBubble(text, who = "bot") {
  const wrap = document.createElement("div");
  wrap.className = `bubble ${who}`;
  wrap.innerHTML = `<div class="bubble__content"></div>`;
  wrap.querySelector(".bubble__content").textContent = text;
  messagesBox.appendChild(wrap);
  requestAnimationFrame(() => (chat.scrollTop = chat.scrollHeight));
}

function setTyping(on) {
  if (on) { addBubble("…", "bot"); return; }
  const kids = messagesBox.querySelectorAll(".bubble.bot .bubble__content");
  for (let i = kids.length - 1; i >= 0; i--) {
    if (kids[i].textContent === "…") { kids[i].closest(".bubble").remove(); break; }
  }
}

function pop(html, title = "Info") {
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  modal.showModal();
}
document.getElementById("modalClose").onclick =
  () => document.getElementById("modal").close();

function updateTokenUI() {
  if (tokenCountEl) tokenCountEl.textContent = tokenBalance.toLocaleString("fr-FR");
}

/* ====== NOUVEAU SYSTÈME DE CALCUL ====== */
function estimateTokensByText(text) {
  if (!text) return 0;
  const cleaned = text.trim();
  const tokens = Math.ceil(cleaned.length / 3.5); // moyenne haute
  return Math.max(1, tokens);
}
function spendTokensEstimate(prompt, answer) {
  const totalTokens = estimateTokensByText(prompt + " " + answer);
  tokenBalance = Math.max(0, tokenBalance - totalTokens);
  localStorage.setItem(LS_TOKENS, tokenBalance);
  updateTokenUI();
}
function spendTokensReal(usage) {
  const used = Math.max(0, Number(usage?.total_tokens) || 0);
  if (used > 0) {
    tokenBalance = Math.max(0, tokenBalance - used);
    localStorage.setItem(LS_TOKENS, tokenBalance);
    updateTokenUI();
  }
}

/* ====== CHAT ====== */
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
      data = {
        answer:
          LANG === "fr"
            ? "Bien reçu. Pose-moi la suite !"
            : LANG === "nl"
            ? "Begrepen. Stel je volgende vraag!"
            : "Got it. Ask me more!",
        usage: { total_tokens: Math.ceil(text.length / 4) + 20 }
      };
    } else {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, conversation })
      });
      data = await resp.json();
    }

    setTyping(false);
    const answer =
      data?.answer || data?.output || data?.text ||
      (LANG === "fr" ? "Réponse vide." : LANG === "nl" ? "Leeg antwoord." : "Empty response.");
    addBubble(answer, "bot");

    if (data?.usage && typeof data.usage.total_tokens === "number") {
      spendTokensReal(data.usage);
    } else {
      spendTokensEstimate(text, answer);
    }

    conversation.push({ role: "assistant", content: answer });
  } catch (e) {
    setTyping(false);
    addBubble(
      LANG === "fr"
        ? "Erreur de connexion. Réessaie plus tard."
        : LANG === "nl"
        ? "Verbindingsfout. Probeer later opnieuw."
        : "Connection error. Please try again later.",
      "bot"
    );
    console.error(e);
  }
}
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });
