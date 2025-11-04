// ===== Config & state =====
const TOKEN_START = 1_000_000;
const TOKEN_COST_PER_MSG = 25; // démo

let tokens = Number(localStorage.getItem("phi_tokens")) || TOKEN_START;
let theme = localStorage.getItem("phi_theme") || "dark";

// ===== DOM =====
const messagesEl   = document.getElementById("messages");
const inputEl      = document.getElementById("userInput");
const sendBtn      = document.getElementById("btnSend");
const micBtn       = document.getElementById("btnMic");
const plusBtn      = document.getElementById("btnPlus");

const sheet        = document.getElementById("sheet");
const sheetBg      = document.getElementById("sheetBg");
const sheetClose   = document.getElementById("sheetClose");
const pickPhotoBtn = document.getElementById("pickPhoto");
const takePhotoBtn = document.getElementById("takePhoto");
const pickFileBtn  = document.getElementById("pickFile");
const imgLibInput  = document.getElementById("imgLibInput");
const imgCamInput  = document.getElementById("imgCamInput");
const docInput     = document.getElementById("docInput");

const tokenCountEl = document.getElementById("tokenCount");
const tokenBadgeEl = document.getElementById("tokenBadge");

const btnLogin     = document.getElementById("btnLogin");
const btnBuy       = document.getElementById("btnBuy");
const btnTheme     = document.getElementById("btnTheme");
const btnMenu      = document.getElementById("btnMenu");

const menu         = document.getElementById("menu");
const menuTheme    = document.getElementById("menuTheme");
const menuFaq      = document.getElementById("menuFaq");

const modalBuy     = document.getElementById("modalBuy");
const modalLogin   = document.getElementById("modalLogin");
const modalFaq     = document.getElementById("modalFaq");

// ===== Init =====
updateTokenUI();
applyTheme(theme);
scrollToBottom();

// ===== Events =====
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e)=>{
  if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); }
});

plusBtn.addEventListener("click", openSheet);
sheetBg.addEventListener("click", closeSheet);
sheetClose.addEventListener("click", closeSheet);

pickPhotoBtn.addEventListener("click", ()=> imgLibInput.click());
takePhotoBtn.addEventListener("click", ()=> imgCamInput.click());
pickFileBtn .addEventListener("click", ()=> docInput.click());

imgLibInput.addEventListener("change", onPickImage);
imgCamInput.addEventListener("change", onPickImage);
docInput.addEventListener("change", onPickDoc);

btnBuy  .addEventListener("click", ()=> modalBuy.showModal());
btnLogin.addEventListener("click", ()=> modalLogin.showModal());

btnTheme.addEventListener("click", toggleTheme);
menuTheme.addEventListener("click", ()=>{ toggleTheme(); hideMenu(); });

btnMenu.addEventListener("click", toggleMenu);
document.addEventListener("click",(e)=>{
  if(!menu.hidden && !menu.contains(e.target) && e.target!==btnMenu){ hideMenu(); }
});

menuFaq.addEventListener("click", ()=>{ modalFaq.showModal(); hideMenu(); });

document.querySelectorAll("[data-close]")
  .forEach(b=> b.addEventListener("click", (e)=>{
    const id = e.currentTarget.getAttribute("data-close");
    document.getElementById(id).close();
  }));

// Option micro (si dispo)
let recognition = null;
if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener("click", ()=>{
    try{
      recognition.start();
      micBtn.textContent = "⏺️";
    }catch(_){}
  });

  recognition.onresult = (e)=>{
    const text = Array.from(e.results).map(r=> r[0].transcript).join(" ");
    inputEl.value = text.trim();
  };
  recognition.onend = ()=> { micBtn.textContent = "🎙️"; };
}else{
  micBtn.addEventListener("click", ()=> alert("La dictée vocale n’est pas disponible sur ce navigateur."));
}

// ===== Functions =====
function sendMessage(){
  const text = inputEl.value.trim();
  if(!text) return;

  // ajoute bulle utilisateur
  addBubble(text, "user");

  // typing
  const typing = addBubble("…", "bot typing");

  // décompte tokens (démo)
  tokens = Math.max(0, tokens - TOKEN_COST_PER_MSG);
  persistTokens();

  // Réponse démo locale (remplace l’appel API réel)
  setTimeout(()=>{
    typing.remove();
    const answer = demoAnswer(text);
    addBubble(answer, "bot");
    scrollToBottom();
  }, 450);
  
  inputEl.value = "";
  scrollToBottom();
}

function addBubble(html, cls=""){
  const div = document.createElement("div");
  div.className = "bubble " + cls;
  div.innerHTML = escapeHtml(html);
  messagesEl.appendChild(div);
  return div;
}

function openSheet(){ sheet.hidden=false; sheetBg.hidden=false; }
function closeSheet(){ sheet.hidden=true;  sheetBg.hidden=true;  }
function toggleMenu(){
  if(menu.hidden){
    const rect = btnMenu.getBoundingClientRect();
    menu.style.top  = (rect.bottom + 6) + "px";
    menu.style.right= (window.innerWidth - rect.right) + "px";
    menu.hidden=false;
  }else hideMenu();
}
function hideMenu(){ menu.hidden=true; }

function onPickImage(e){
  const file = e.target.files?.[0];
  if(!file){ return; }
  closeSheet();
  addBubble("🖼️ Image reçue : <i>"+file.name+"</i>", "user");
  // Ici tu brancheras ton endpoint d'analyse d'image si besoin.
}
function onPickDoc(e){
  const file = e.target.files?.[0];
  if(!file){ return; }
  closeSheet();
  addBubble("📄 Fichier reçu : <i>"+file.name+"</i>", "user");
}

function updateTokenUI(){
  tokenCountEl.textContent = tokens.toLocaleString("fr-FR");
}
function persistTokens(){
  localStorage.setItem("phi_tokens", String(tokens));
  updateTokenUI();
}

function applyTheme(t){
  document.body.classList.toggle("light", t==="light");
  document.body.classList.toggle("dark",  t!=="light");
  localStorage.setItem("phi_theme", t);
  btnTheme.textContent = (t==="light") ? "☀️" : "🌙";
}
function toggleTheme(){
  theme = (theme==="light") ? "dark" : "light";
  applyTheme(theme);
}

function scrollToBottom(){ requestAnimationFrame(()=> window.scrollTo({top:document.body.scrollHeight, behavior:"smooth"})); }

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

// Petite “IA” locale pour la démo
function demoAnswer(text){
  const t = text.toLowerCase();
  if(/bonjour|salut|bj|bonsoir/.test(t)) return "Bonjour 👋 Comment puis-je t’aider ?";
  if(/7[ \t]*\/[ \t]*3/.test(t)) return "7 ÷ 3 ≈ 2,33.";
  if(/dagobert/.test(t)) return "Dagobert est un roi mérovingien du VIIᵉ siècle (le fameux 'le roi Dagobert a mis sa culotte à l’envers').";
  if(/mode|nuit|jour/.test(t)) return "Le mode sombre est activé par défaut. Tu peux changer dans le menu ≡.";
  return "👌 Bien reçu. Pose-moi la suite !";
}
