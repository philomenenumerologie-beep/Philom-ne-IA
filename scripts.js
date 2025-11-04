// ===== CONFIG =====
const API_URL = "https://api.philomenia.com/ask";     // ← remplace par ton endpoint
const API_IMG = "https://api.philomenia.com/image";   // ← remplace si besoin

let tokenCount = Number(localStorage.getItem("tokenCount") || "1000000");
let theme = localStorage.getItem("theme") || "dark";
if(theme === "light") document.body.classList.replace("theme-dark","theme-light");

// ===== DOM =====
const messages = document.getElementById("messages");
const tokenCountEl = document.getElementById("tokenCount");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const plusBtn = document.getElementById("plusBtn");

const sheet = document.getElementById("sheet");
const sheetBg = document.getElementById("sheetBg");
const sheetClose = document.getElementById("sheetClose");
const pickPhoto = document.getElementById("pickPhoto");
const takePhoto = document.getElementById("takePhoto");
const pickFile  = document.getElementById("pickFile");
const imgLibrary = document.getElementById("imgLibrary");
const imgCamera  = document.getElementById("imgCamera");
const docInput   = document.getElementById("docInput");

const popup = document.getElementById("popup");
const popupBody = document.getElementById("popupBody");
const popupClose = document.getElementById("popupClose");

const menu = document.getElementById("menu");
const btnMenu = document.getElementById("btnMenu");
const toggleThemeBtn = document.getElementById("toggleTheme");
const openFAQBtn = document.getElementById("openFAQ");
const faq = document.getElementById("faq");
const faqClose = document.getElementById("faqClose");

const btnLogin = document.getElementById("btnLogin");
const btnBuy = document.getElementById("btnBuy");

// ===== Helpers =====
const fmt = n => n.toLocaleString("fr-FR");
function updateTokensDisplay(){
  tokenCountEl.textContent = fmt(tokenCount);
  localStorage.setItem("tokenCount", String(tokenCount));
}
function addBubble(text, role="bot"){
  const b = document.createElement("div");
  b.className = "bubble " + (role === "user" ? "user" : "bot");
  b.textContent = text;
  messages.appendChild(b);
  b.scrollIntoView({behavior:"smooth", block:"end"});
}
function setTyping(on){
  if(on){
    addBubble("…", "bot");
  }else{
    // supprime le dernier "…"
    const last = [...messages.querySelectorAll(".bubble")].pop();
    if(last && last.textContent === "…") last.remove();
  }
}
function openPopup(text){
  popupBody.innerHTML = text;
  popup.showModal();
}
function openSheet(){
  sheet.hidden = false; sheetBg.hidden = false;
}
function closeSheet(){
  sheet.hidden = true; sheetBg.hidden = true;
}
function toggleMenu(){
  menu.hidden = !menu.hidden;
}

// ===== Theme toggle (default DARK) =====
function toggleTheme(){
  const isLight = document.body.classList.contains("theme-light");
  if(isLight){
    document.body.classList.replace("theme-light","theme-dark");
    localStorage.setItem("theme","dark");
  }else{
    document.body.classList.replace("theme-dark","theme-light");
    localStorage.setItem("theme","light");
  }
}

// ===== Messaging =====
async function sendMessage(text){
  const msg = (text ?? userInput.value).trim();
  if(!msg) return;
  userInput.value = "";

  addBubble(msg, "user");

  // coût (approx) : longueur/2 entrée + sortie estimée
  const estIn = Math.max(8, Math.ceil(msg.length / 2));
  tokenCount = Math.max(0, tokenCount - estIn);
  updateTokensDisplay();

  setTyping(true);
  try{
    // Essaie ton backend ; sinon fallback “local”
    const resp = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message: msg})
    });

    let textOut = "";
    if(resp.ok){
      const data = await resp.json();
      textOut = (data.answer || data.message || "D’accord.");
    }else{
      // Fallback local si API absente
      textOut = "Bien reçu. Pose-moi la suite !";
    }

    setTyping(false);
    addBubble(textOut, "bot");

    const estOut = Math.max(12, Math.ceil(textOut.length / 2));
    tokenCount = Math.max(0, tokenCount - estOut);
    updateTokensDisplay();
  }catch(e){
    setTyping(false);
    addBubble("Erreur réseau. Réessaie dans un instant.", "bot");
  }
}

// ===== Image / Doc handlers =====
async function handleImage(file){
  if(!file) return;
  addBubble("🖼️ Image envoyée : " + (file.name || "photo"), "user");

  setTyping(true);
  try{
    const fd = new FormData();
    fd.append("image", file);
    fd.append("prompt", "Analyse cette image.");

    const resp = await fetch(API_IMG, { method:"POST", body:fd });
    let answer = "Image reçue. Merci !";
    if(resp.ok){
      const data = await resp.json();
      answer = data.answer || answer;
    }
    setTyping(false);
    addBubble(answer, "bot");

    tokenCount = Math.max(0, tokenCount - 256); // forfait image simple
    updateTokensDisplay();
  }catch(e){
    setTyping(false);
    addBubble("Impossible d’envoyer l’image pour le moment.", "bot");
  }
}
async function handleDoc(file){
  if(!file) return;
  addBubble("📄 Fichier envoyé : " + (file.name || "document"), "user");
  tokenCount = Math.max(0, tokenCount - 128);
  updateTokensDisplay();
  // À raccorder à ton backend si besoin
}

// ===== Mic (Web Speech API) =====
let recognition = null;
if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e)=>{
    const t = e.results[0][0].transcript;
    userInput.value = (userInput.value + " " + t).trim();
  };
}
function toggleMic(){
  if(!recognition){ openPopup("La dictée vocale n’est pas supportée sur ce navigateur."); return; }
  recognition.start();
}

// ===== Events =====
sendBtn.addEventListener("click", ()=>sendMessage());
userInput.addEventListener("keydown", e=>{
  if(e.key==="Enter"){ e.preventDefault(); sendMessage(); }
});

micBtn.addEventListener("click", toggleMic);

plusBtn.addEventListener("click", openSheet);
sheetBg.addEventListener("click", closeSheet);
sheetClose.addEventListener("click", closeSheet);

pickPhoto.addEventListener("click", ()=> imgLibrary.click());
takePhoto.addEventListener("click", ()=> imgCamera.click());
pickFile .addEventListener("click", ()=> docInput.click());

imgLibrary.addEventListener("change", ()=> handleImage(imgLibrary.files[0]));
imgCamera .addEventListener("change", ()=> handleImage(imgCamera.files[0]));
docInput  .addEventListener("change", ()=> handleDoc(docInput.files[0]));

// Menu / FAQ
btnMenu.addEventListener("click", toggleMenu);
document.addEventListener("click", (e)=>{
  if(!menu.hidden && !menu.contains(e.target) && e.target!==btnMenu){ menu.hidden = true; }
});
toggleThemeBtn.addEventListener("click", ()=>{ toggleTheme(); menu.hidden=true; });
openFAQBtn.addEventListener("click", ()=>{ menu.hidden=true; faq.showModal(); });
faqClose.addEventListener("click", ()=> faq.close());

// Popups Connexion / Acheter (placeholders)
btnLogin.addEventListener("click", ()=> openPopup("Connexion : lier ton compte (placeholder)."));
btnBuy  .addEventListener("click", ()=> openPopup("Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ (<strong>+50% au 1er achat</strong>)."));
popupClose.addEventListener("click", ()=> popup.close());

// ===== INIT =====
function greet(){
  addBubble("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
}
updateTokensDisplay();
greet();
