// ===== CONFIG =====
const API_URL = "https://api.philomeneia.com/ask";   // <- ton endpoint réel
const API_IMG = "https://api.philomeneia.com/image"; // <- optionnel si tu traites l'image
let tokenCount = 1_000_000; // affichage
let darkMode = true;        // par défaut sombre
let recognition = null;

const userId = "guest_" + Math.random().toString(36).slice(2, 9);
let conversation = [];

// ===== DOM =====
const chatBox     = document.getElementById("chatBox");
const userInput   = document.getElementById("userInput");
const sendButton  = document.getElementById("sendButton");
const micButton   = document.getElementById("micButton");
const plusBtn     = document.getElementById("plusBtn");

const sheetBackdrop = document.getElementById("sheetBackdrop");
const sheet       = document.getElementById("attachSheet");
const sheetClose  = document.getElementById("sheetClose");
const pickPhoto   = document.getElementById("pickPhoto");
const takePhoto   = document.getElementById("takePhoto");
const pickFile    = document.getElementById("pickFile");
const imgLibInput = document.getElementById("imgLibInput");
const imgCamInput = document.getElementById("imgCamInput");
const docInput    = document.getElementById("docInput");

const menuButton  = document.getElementById("menuButton");
const menu        = document.getElementById("menu");
const toggleMode  = document.getElementById("toggleMode");
const openFaqBtn  = document.getElementById("openFaq");

const popup       = document.getElementById("popup");
const faqModal    = document.getElementById("faqModal");
const faqClose    = document.getElementById("faqClose");

const tokenBadge  = document.getElementById("tokenBadge");
const tokenEl     = document.getElementById("tokenCount");
const loginBtn    = document.getElementById("btnLogin");
const buyBtn      = document.getElementById("btnBuy");

// ===== Helpers UI =====
function addMessage(text, who="bot"){
  const b = document.createElement("div");
  b.className = "bubble " + (who === "user" ? "user" : "bot");
  b.textContent = text;
  chatBox.appendChild(b);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function setTyping(on){
  if(on){
    const ghost = document.createElement("div");
    ghost.className = "bubble bot";
    ghost.id = "typing";
    ghost.textContent = "…";
    chatBox.appendChild(ghost);
    chatBox.scrollTop = chatBox.scrollHeight;
  }else{
    const t = document.getElementById("typing");
    if(t) t.remove();
  }
}
function updateTokenDisplay(){
  tokenEl.textContent = tokenCount.toLocaleString("fr-FR");
}

// Bottom sheet
function openSheet(){ sheet.hidden = false; sheetBackdrop.hidden = false; }
function closeSheet(){ sheet.hidden = true;  sheetBackdrop.hidden = true; }

// Menu
function toggleMenu(){ menu.hidden = !menu.hidden; }
document.addEventListener("click", (e)=>{
  if(!menu.hidden && !menu.contains(e.target) && e.target !== menuButton){
    menu.hidden = true;
  }
});

// Popups
function showPopup(text){
  popup.innerHTML = `<div class="content">${text}<div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="pill strong" onclick="document.getElementById('popup').close()">Fermer</button></div></div>`;
  popup.showModal();
}

// Toggle theme (défaut sombre)
function applyTheme(){
  document.body.classList.toggle("theme-light", !darkMode);
}
function toggleTheme(){
  darkMode = !darkMode;
  applyTheme();
}

// ===== Envoi message texte =====
async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;

  addMessage(text, "user");
  conversation.push({role:"user", content:text});
  userInput.value = "";

  setTyping(true);

  try{
    const resp = await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ userId, conversation })
    });

    const ok = resp.ok;
    const data = ok ? await resp.json() : null;
    setTyping(false);

    if(ok && data && data.answer){
      addMessage(data.answer, "bot");

      // coût approximatif sortie (facultatif)
      const estOut = Math.max(8, Math.ceil(data.answer.length / 6));
      tokenCount = Math.max(0, tokenCount - estOut);
      updateTokenDisplay();

      conversation.push({role:"assistant", content:data.answer});
    }else{
      // Fallback visible pour ne jamais “planter”
      const fallback = "Bien reçu. Pose-moi la suite !";
      addMessage(fallback, "bot");
      conversation.push({role:"assistant", content:fallback});
    }
  }catch(err){
    setTyping(false);
    const fallback = "Bien reçu. Pose-moi la suite !";
    addMessage(fallback, "bot");
    conversation.push({role:"assistant", content:fallback});
  }
}

// ===== Envoi image/document (optionnel) =====
async function uploadFile(file, kind="image"){
  if(!file) return;
  closeSheet();

  setTyping(true);
  try{
    const form = new FormData();
    if(kind==="image") form.append("image", file); else form.append("file", file);
    form.append("userId", userId);
    form.append("prompt", kind==="image" ? "Analyse cette image." : "Analyse ce document.");

    const resp = await fetch(API_IMG, { method:"POST", body:form });
    const data = await resp.json();
    setTyping(false);

    if(data && data.answer){
      addMessage(data.answer, "bot");
      const estOut = Math.ceil(data.answer.length / 6);
      tokenCount = Math.max(0, tokenCount - estOut);
      updateTokenDisplay();
      conversation.push({role:"assistant", content:data.answer});
    }else{
      addMessage("Fichier reçu 👍", "bot");
      conversation.push({role:"assistant", content:"Fichier reçu."});
    }
  }catch(e){
    setTyping(false);
    addMessage("Erreur lors de l’envoi du fichier.", "bot");
  }
}

// ===== Dictée (placeholder simple) =====
micButton.addEventListener("click", () => {
  showPopup("Dictée : à venir (placeholder).");
});

// ===== Listeners =====
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") sendMessage();
});

plusBtn.addEventListener("click", openSheet);
sheetBackdrop.addEventListener("click", closeSheet);
sheetClose.addEventListener("click", closeSheet);

pickPhoto.addEventListener("click", ()=> imgLibInput.click());
takePhoto.addEventListener("click", ()=> imgCamInput.click());
pickFile .addEventListener("click", ()=> docInput.click());

imgLibInput.addEventListener("change", ()=> uploadFile(imgLibInput.files[0], "image"));
imgCamInput.addEventListener("change", ()=> uploadFile(imgCamInput.files[0], "image"));
docInput   .addEventListener("change", ()=> uploadFile(docInput.files[0], "doc"));

menuButton.addEventListener("click", toggleMenu);
toggleMode.addEventListener("click", ()=>{ toggleTheme(); menu.hidden = true; });
openFaqBtn.addEventListener("click", ()=>{ menu.hidden = true; faqModal.showModal(); });
faqClose.addEventListener("click", ()=> faqModal.close());

// Connexion / Acheter (placeholders)
loginBtn.addEventListener("click", ()=>{
  showPopup("<strong>Connexion</strong> : lier ton compte (placeholder).");
});
buyBtn.addEventListener("click", ()=>{
  showPopup(
    "<strong>Acheter des tokens</strong> : 1M=5€ • 2M=10€ • 4M=20€ (<strong>+50% au 1er achat</strong>)."
  );
});

// ===== INIT =====
addMessage("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
updateTokenDisplay();
applyTheme();
