// ====== Config ======
const API_URL = "";            // mettre votre backend si dispo, sinon fallback local
let tokenCount = 1_000_000;    // affichage
const VERSION = "1.0";

// ====== DOM ======
const chat = document.getElementById("chat");
const tokenEl = document.getElementById("tokenCount");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const plusBtn = document.getElementById("plusBtn");
const micBtn = document.getElementById("micBtn");

const btnMenu = document.getElementById("btnMenu");
const menuSheet = document.getElementById("menuSheet");
const toggleModeBtn = document.getElementById("toggleMode");
const openFaqBtn = document.getElementById("openFaq");
const closeMenuBtn = document.getElementById("closeMenu");

const attachSheet = document.getElementById("attachSheet");
const pickGalleryBtn = document.getElementById("pickGallery");
const takePhotoBtn = document.getElementById("takePhoto");
const pickFileBtn = document.getElementById("pickFile");
const closeAttachBtn = document.getElementById("closeAttach");

const imgLibInput = document.getElementById("imgFromLib");
const imgCamInput = document.getElementById("imgFromCam");
const docInput = document.getElementById("docInput");

const btnLogin = document.getElementById("btnLogin");
const btnBuy = document.getElementById("btnBuy");
const popup = document.getElementById("popup");

// ====== Utils ======
function fmtTokens(n){
  return n.toLocaleString("fr-FR").replace(/\s/g, " ");
}
function addBubble(text, who="bot"){
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight + 9999;
}
function setTyping(on=true){
  if(on){
    addBubble("…", "bot");
  }else{
    // remove last typing
    const last = chat.querySelector(".bubble.bot:last-child");
    if(last && last.textContent === "…") last.remove();
  }
}
function showPopup(html){
  popup.innerHTML = html + `<div style="margin-top:14px; text-align:right"><button id="closePopup" class="pill">Fermer</button></div>`;
  if(typeof popup.showModal === "function"){ popup.showModal(); } else { popup.setAttribute("open",""); }
  popup.querySelector("#closePopup").onclick = () => popup.close();
}

// ====== Menu / Sheets ======
btnMenu.onclick = () => menuSheet.classList.remove("hidden");
closeMenuBtn.onclick = () => menuSheet.classList.add("hidden");
toggleModeBtn.onclick = () => {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
};
openFaqBtn.onclick = () => {
  menuSheet.classList.add("hidden");
  showPopup(`
  <h3>Foire aux questions</h3>
  <p><strong>Quelle IA utilise Philomène ?</strong><br>
     Philomène I.A. est propulsée par <b>GPT-5 Thinking</b>.</p>
  <p><strong>Comment fonctionnent les tokens ?</strong><br>
     Chaque question + réponse utilise un petit nombre de tokens. Le diamant 💎 affiche le solde.</p>
  <p><strong>Packs :</strong><br>
     💎 1 000 000 → 5 € &nbsp;•&nbsp; 💎 2 000 000 → 10 € &nbsp;•&nbsp; 💎 4 000 000 → 20 €<br>
     🎁 Premier achat : <b>+50 % offerts</b>.</p>
  `);
};

// Attachments
plusBtn.onclick = () => attachSheet.classList.remove("hidden");
closeAttachBtn.onclick = () => attachSheet.classList.add("hidden");

pickGalleryBtn.onclick = () => imgLibInput.click();
takePhotoBtn.onclick   = () => imgCamInput.click();
pickFileBtn.onclick    = () => docInput.click();

imgLibInput.onchange = handleImage;
imgCamInput.onchange = handleImage;
docInput.onchange    = handleDoc;

async function handleImage(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  addBubble("📷 Image reçue. Analyse en cours…", "user");
  await fakeLatency();
  addBubble("J’ai bien reçu la photo. Dis-moi ce que tu veux que j’en fasse.", "bot");
}
async function handleDoc(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  addBubble(`📄 Fichier reçu : ${file.name}`, "user");
  await fakeLatency();
  addBubble("Merci. Je peux en extraire le texte si tu veux.", "bot");
}

// ====== Auth & Buy (popups placeholders) ======
btnLogin.onclick = () => showPopup(`Connexion : lier ton compte (placeholder).`);
btnBuy.onclick   = () => showPopup(`Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ <br/><b>(+50% au 1er achat)</b>.`);

// ====== Send & AI ======
sendBtn.onclick = sendMessage;
userInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    e.preventDefault();
    sendMessage();
  }
});

function consumeTokens(inCount=60, outCount=140){
  tokenCount = Math.max(0, tokenCount - (inCount + outCount));
  tokenEl.textContent = fmtTokens(tokenCount);
}

async function sendMessage(){
  const text = (userInput.value || "").trim();
  if(!text) return;
  addBubble(text, "user");
  userInput.value = "";
  setTyping(true);

  // Essayez l’API si fournie, sinon fallback local
  try{
    let reply;
    if(API_URL){
      const resp = await fetch(API_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message:text })
      });
      const data = await resp.json();
      reply = data.answer || data.reply || JSON.stringify(data);
    }else{
      reply = await localReply(text);
    }
    setTyping(false);
    addBubble(reply, "bot");
    consumeTokens();
  }catch(err){
    setTyping(false);
    addBubble("Désolé, une erreur est survenue. Réessaie.", "bot");
  }
}

// Fallback “intelligent” local
async function localReply(q){
  await fakeLatency();
  const s = q.toLowerCase().trim();

  // maths rapides
  const math = tryEval(s);
  if(math !== null) return `🧮 Résultat : ${math}`;

  if(/(heure|time)/.test(s)){
    return `⌚ Il est ${new Date().toLocaleTimeString("fr-FR")}.`;
  }
  if(/(bj|bonjour|salut|hello)/.test(s)) return "Bonjour ! Comment puis-je t’aider ?";

  if(s.length <= 3) return "👌 Bien reçu. Pose-moi la suite !";

  return `D’accord. Voici ce que je comprends : « ${q} ». Dis-moi si tu veux un résumé, des idées, ou un calcul.`;
}
function tryEval(s){
  // sécurise un petit parse math
  if(!/^[\d\+\-\*\/\.\(\)\s%]+$/.test(s)) return null;
  try{
    // eslint-disable-next-line no-eval
    const r = eval(s);
    if(typeof r === "number" && isFinite(r)) return Number(r.toFixed(6));
  }catch(_){}
  return null;
}
function fakeLatency(){ return new Promise(r => setTimeout(r, 600)); }

// ====== Speech to text ======
let recognition=null;
micBtn.onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ showPopup("La dictée vocale n’est pas supportée sur cet appareil."); return; }
  if(recognition){ recognition.stop(); recognition = null; micBtn.classList.remove("active"); return; }
  recognition = new SR();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.onresult = (e)=>{
    const txt = Array.from(e.results).map(r=>r[0].transcript).join(" ");
    userInput.value = (userInput.value ? userInput.value+" " : "") + txt;
  };
  recognition.onend = ()=>{ micBtn.classList.remove("active"); recognition=null; };
  recognition.start(); micBtn.classList.add("active");
};

// ====== Init ======
tokenEl.textContent = fmtTokens(tokenCount);
document.body.classList.add("dark");   // sombre par défaut
