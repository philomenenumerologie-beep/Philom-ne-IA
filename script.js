// === CONFIG ===
const API_URL = "https://api.philomeneia.com"; // ← remplace par ton vrai backend
const USE_BACKEND = true; // passe à false si tu veux tester sans serveur

// === ÉLÉMENTS ===
const chatBox     = document.getElementById("chatBox");
const userInput   = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const tokenCount  = document.getElementById("tokenCount");
const toggleMode  = document.getElementById("toggleMode");

const menuBtn     = document.getElementById("menuBtn");
const menu        = document.getElementById("menu");
const openFAQ     = document.getElementById("openFAQ");
const faqModal    = document.getElementById("faqModal");
const faqClose    = document.getElementById("faqClose");
const newChat     = document.getElementById("newChat");

// Tiroir (plus / moins)
const attachToggle = document.getElementById("attachToggle");
const attachTray   = document.getElementById("attachTray");
const pickPhoto    = document.getElementById("pickPhoto");
const pickDoc      = document.getElementById("pickDoc");
const pickMic      = document.getElementById("pickMic");

// === ÉTAT TOKENS ===
let tokens = 1_000_000;
function setTokens(n) {
  tokens = Math.max(0, n | 0);
  tokenCount.textContent = tokens.toLocaleString("fr-FR");
}
setTokens(tokens);

// === MESSAGES ===
function addMsg(text, who = "ai") {
  const msg = document.createElement("div");
  msg.className = "msg " + (who === "user" ? "user" : "ai");
  msg.textContent = text;
  chatBox.appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth", block: "end" });
}

// === MENUS ===
function toggleMenu(show) {
  const want = show === true || (show === undefined && menu.classList.contains("hidden"));
  menu.classList.toggle("hidden", !want);
}

function toggleTray(open) {
  const want = open === true || (open === undefined && !attachTray.classList.contains("open"));
  attachTray.classList.toggle("open", want);
  attachTray.setAttribute("aria-hidden", want ? "false" : "true");
  attachToggle.setAttribute("aria-expanded", want ? "true" : "false");
  attachToggle.textContent = want ? "−" : "＋";
}

// Fermer menu/tiroir si clic dehors
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== menuBtn) toggleMenu(false);
  if (!attachTray.contains(e.target) && e.target !== attachToggle) toggleTray(false);
});

// === ÉVÉNEMENTS TOPBAR ===
menuBtn.addEventListener("click", () => toggleMenu());
openFAQ.addEventListener("click", () => {
  faqModal.classList.remove("hidden");
  toggleMenu(false);
});
faqClose.addEventListener("click", () => faqModal.classList.add("hidden"));
newChat.addEventListener("click", () => {
  chatBox.innerHTML = "";
  addMsg("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.");
  toggleMenu(false);
});
toggleMode.addEventListener("click", () => {
  document.body.classList.toggle("theme-dark");
});

// === TIROIR +/− ===
attachToggle.addEventListener("click", () => toggleTray());

// === ACTIONS DU TIROIR ===
pickPhoto.addEventListener("click", () => {
  addMsg("📷 (photo) — fonctionnalité à venir.", "ai");
  toggleTray(false);
});
pickDoc.addEventListener("click", () => {
  addMsg("📄 (document) — fonctionnalité à venir.", "ai");
  toggleTray(false);
});
pickMic.addEventListener("click", () => {
  addMsg("🎤 (micro) — fonctionnalité à venir.", "ai");
  toggleTray(false);
});

// === ENVOI MESSAGE ===
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";
  addMsg(text, "user");

  // décompte de tokens (visuel)
  setTokens(tokens - 20);

  try {
    if (USE_BACKEND) {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "guest",
          conversation: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      addMsg(data.answer || "Réponse reçue !");
    } else {
      // Mode local
      await new Promise((r) => setTimeout(r, 600));
      addMsg("Démo locale : réponse simulée à \"" + text + "\".");
    }
  } catch (err) {
    console.error(err);
    addMsg("⚠️ Erreur réseau, réessaie.", "ai");
  }
}

// === ENVOI ===
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// === MESSAGE D’ACCUEIL ===
addMsg("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.");
