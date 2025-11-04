/* ===== CONFIG ===== */
const API_URL = "https://api.philomeneia.com/ask"; // <-- ton endpoint backend
const FALLBACK_URL = "/ask"; // secours si API_URL vide
const VERSION = "version 1.2"; // affiché sous le header

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
  tokenBalance = 1_000_000; // affichage par défaut invité (tu peux changer)
  localStorage.setItem(LS_TOKENS, tokenBalance);
}
updateTokenUI();

const conversation = [
  { role: "assistant", content: "👋 Bonjour ! Je suis Philomène I.A., ton assistante personnelle." }
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
  if (on) {
    addBubble("…", "bot"); // indicateur
  } else {
    const kids = messagesBox.querySelectorAll(".bubble.bot .bubble__content");
    for (let i = kids.length - 1; i >= 0; i--) {
      if (kids[i].textContent === "…") {
        kids[i].closest(".bubble").remove();
        break;
      }
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
  // secours si usage absent : ~1 token ≈ 4 chars
  const est = Math.ceil((str || "").length / 4);
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
  if (isLight) body.classList.remove("theme-dark");
  else body.classList.add("theme-dark");
  dropdown.hidden = true;
});
openFaq.addEventListener("click", () => {
  dropdown.hidden = true;
  pop(
    `
    <div class="faq">
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
    </div>
  `,
    "Foire aux questions"
  );
});

/* ===== Connexion / Acheter (placeholders) ===== */
btnLogin.addEventListener("click", () => pop("Connexion : lier ton compte (placeholder).", "Connexion"));
btnBuy.addEventListener("click", () => pop("Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ (+50% au 1er achat).", "Acheter"));

/* ===== Sheet Joindre ===== */
function openSheet() { sheet.hidden = false; }
function closeSheet(){ sheet.hidden = true; }
plusBtn.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);

pickLibrary.addEventListener("click", () => imgLibraryInput.click());
takePhoto.addEventListener("click",   () => imgCameraInput.click());
pickFile.addEventListener("click",    () => docInput.click());

function handlePickedFile(file) {
  if (!file) return;
  addBubble(`📎 Fichier reçu : ${file.name}`, "user");
  // TODO: appeler /analyze-image ici si tu veux traiter côté serveur
  closeSheet();
}
imgLibraryInput.onchange = (e) => handlePickedFile(e.target.files?.[0]);
imgCameraInput.onchange  = (e) => handlePickedFile(e.target.files?.[0]);
docInput.onchange        = (e) => handlePickedFile(e.target.files?.[0]);

/* ===== Micro (Web Speech API si dispo) ===== */
let recognition = null;
if ("webkitSpeechRecognition" in window) {
  const R = window.webkitSpeechRecognition;
  recognition = new R();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const txt = e.results[0][0].transcript;
    input.value = txt;
  };
}
micBtn.addEventListener("click", () => {
  if (recognition) recognition.start();
  else pop("Le micro n’est pas supporté par ce navigateur.", "Micro");
});

/* ===== Envoi message (décompte réel) ===== */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // UI + scroll
  addBubble(text, "user");
  input.value = "";
  setTyping(true);

  // construire l'historique à envoyer
  conversation.push({ role: "user", content: text });

  // choix URL
  const url = API_URL || FALLBACK_URL;

  try {
    let data;

    if (url === FALLBACK_URL) {
      // Mode démo local : simule une réponse
      await new Promise((r) => setTimeout(r, 400));
      data = { answer: "Bien reçu. Pose-moi la suite !", usage: { total_tokens: Math.ceil(text.length / 4) + 20 } };
    } else {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversation  // on envoie tout l'historique côté serveur (mémoire)
        })
      });
      data = await resp.json();
    }

    setTyping(false);

    const answer = data?.answer || data?.output || data?.text || "Réponse vide.";
    addBubble(answer, "bot");

    // Décompte réel si usage dispo, sinon estimation par longueur
    if (data?.usage && typeof data.usage.total_tokens === "number") {
      spendTokensReal(data.usage);
    } else {
      // fallback : on retire l'entrée + la sortie estimées
      spendEstimateByText(text);
      spendEstimateByText(answer);
    }

    // mémorise la réponse
    conversation.push({ role: "assistant", content: answer });
  } catch (e) {
    setTyping(false);
    addBubble("Erreur de connexion. Réessaie plus tard.", "bot");
    console.error(e);
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

/* ===== Auto-scroll: garde le bas visible ===== */
const io = new IntersectionObserver(() => {
  chat.scrollTop = chat.scrollHeight;
});
io.observe(document.getElementById("composer"));
