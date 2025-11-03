// === CONFIG GÉNÉRALE ===
const API_URL = "https://api.philomeneia.com/ask"; // ton backend GPT-5
let tokenCount = 1000000; // solde initial par défaut
let darkMode = true;
let recognition;

// === ÉLÉMENTS DU DOM ===
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const photoButton = document.getElementById("photoButton");
const docButton = document.getElementById("docButton");
const tokenCountEl = document.getElementById("tokenCount");
const toggleMode = document.getElementById("toggle-mode");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const openFAQ = document.getElementById("openFAQ");
const faqPopup = document.getElementById("faqPopup");
const closeFAQ = document.getElementById("closeFAQ");
const resetChat = document.getElementById("resetChat");

let conversation = [];
const userId = "guest_" + Math.random().toString(36).substring(2, 10);

// === AFFICHAGE DE MESSAGE ===
function addMessage(content, sender = "bot") {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === ENVOI DU MESSAGE UTILISATEUR ===
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  // Estimation du coût en tokens selon la taille du message
  const estimatedTokens = Math.ceil(text.length / 4); // ~1 token = 4 caractères
  tokenCount -= estimatedTokens;
  updateTokenDisplay();

  addMessage("...", "bot");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        conversation: [...conversation, { role: "user", content: text }]
      })
    });

    const data = await response.json();
    chatBox.lastChild.remove(); // retire le "..."
    if (data.answer) {
      addMessage(data.answer, "bot");

      // Estimation du coût de la réponse
      const answerTokens = Math.ceil(data.answer.length / 4);
      tokenCount -= answerTokens;
      updateTokenDisplay();

      // Mémorisation locale
      conversation.push({ role: "user", content: text });
      conversation.push({ role: "assistant", content: data.answer });
    } else {
      addMessage("Erreur : aucune réponse reçue.", "bot");
    }
  } catch (err) {
    chatBox.lastChild.remove();
    addMessage("Erreur de connexion au serveur.", "bot");
  }
}

// === MISE À JOUR DU DIAMANT ===
function updateTokenDisplay() {
  tokenCountEl.textContent = tokenCount.toLocaleString("fr-FR");
  if (tokenCount < 1000) tokenCountEl.style.color = "#ff5555";
  else tokenCountEl.style.color = "#b085ff";
}

// === MICRO ===
micButton.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("La reconnaissance vocale n’est pas supportée sur ce navigateur.");
    return;
  }

  if (recognition) {
    recognition.stop();
    recognition = null;
    micButton.textContent = "🎤";
  } else {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.onresult = e => {
      userInput.value = e.results[0][0].transcript;
    };
    recognition.start();
    micButton.textContent = "🛑";
  }
});

// === MODE JOUR/NUIT ===
toggleMode.addEventListener("click", () => {
  darkMode = !darkMode;
  document.body.classList.toggle("light-mode", !darkMode);
});

// === MENU BURGER ===
menuButton.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});

// === FAQ ===
openFAQ.addEventListener("click", () => {
  faqPopup.classList.remove("hidden");
  menu.classList.add("hidden");
});
closeFAQ.addEventListener("click", () => {
  faqPopup.classList.add("hidden");
});

// === RESET CHAT ===
resetChat.addEventListener("click", () => {
  conversation = [];
  chatBox.innerHTML = "";
  addMessage("Nouvelle discussion commencée.", "bot");
  menu.classList.add("hidden");
});

// === ENVOI PAR BOUTON OU ENTER ===
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// === BOUTON PHOTO ===
photoButton.addEventListener("click", () => {
  alert("📷 L’analyse d’image sera activée dans la prochaine mise à jour !");
});

// === BOUTON DOCUMENT ===
docButton.addEventListener("click", () => {
  alert("📄 L’envoi de documents sera disponible prochainement !");
});

// === INITIALISATION ===
addMessage("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
updateTokenDisplay();
