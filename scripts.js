// ===== CONFIG =====
const API_URL = "/ask";      // fallback si pas d’API custom
const API_IMG = "/img";      // fallback images
let tokenCount = 1_000_000;  // affichage du diamant
let conversation = [];

// ===== SELECTEURS =====
const tokenCountEl = document.getElementById('tokenCount');
const menuBtn   = document.getElementById('menuBtn');
const menuSheet = document.getElementById('menuSheet');
const toggleModeBtn = document.getElementById('toggleMode');
const faqBtn = document.getElementById('openFaq');

const loginBtn = document.getElementById('loginBtn');
const buyBtn   = document.getElementById('buyBtn');

const messagesEl = document.getElementById('messages');
const userInput  = document.getElementById('userInput');
const sendBtn    = document.getElementById('sendBtn');
const micBtn     = document.getElementById('micBtn');

const plusBtn    = document.getElementById('plusBtn');
const attachSheet= document.getElementById('attachSheet');
const closeAttach= document.getElementById('closeAttach');
const pickPhoto  = document.getElementById('pickPhoto');
const takePhoto  = document.getElementById('takePhoto');
const pickFile   = document.getElementById('pickFile');
const imgLibInput= document.getElementById('imgLibInput');
const imgCamInput= document.getElementById('imgCamInput');
const docInput   = document.getElementById('docInput');

const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const popupClose = document.getElementById('popupClose');

// ===== INIT =====
tokenCountEl.textContent = tokenCount.toLocaleString('fr-FR');
const savedMode = localStorage.getItem('mode') || 'dark';
document.body.classList.toggle('light', savedMode === 'light');
document.body.classList.toggle('dark',  savedMode !== 'light');

// ===== UI HELPERS =====
function addMessage(text, who='bot'){
  const div = document.createElement('div');
  div.className = 'bubble ' + (who==='user'?'from-user':'from-bot');
  div.textContent = text;
  messagesEl.appendChild(div);
  // scroll
  setTimeout(()=>window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}),10);
}
function setTyping(on){
  if(on){
    addMessage('…', 'bot');
  }else{
    // remove last "…" if present
    const last = messagesEl.lastElementChild;
    if(last && last.textContent === '…') last.remove();
  }
}
function openPopup(html){
  popupContent.innerHTML = html;
  popup.showModal();
}
popupClose.addEventListener('click', ()=>popup.close());

// ===== MENU =====
menuBtn.addEventListener('click', ()=>{
  menuSheet.classList.toggle('hidden');
});
document.addEventListener('click', (e)=>{
  if(!menuSheet.contains(e.target) && e.target!==menuBtn){
    menuSheet.classList.add('hidden');
  }
});
toggleModeBtn.addEventListener('click', ()=>{
  const light = document.body.classList.toggle('light');
  document.body.classList.toggle('dark', !light);
  localStorage.setItem('mode', light ? 'light' : 'dark');
  menuSheet.classList.add('hidden');
});

// ===== FAQ POPUP =====
faqBtn.addEventListener('click', ()=>{
  const html = `
  <h3>🗨️ Foire aux questions</h3>
  <p><strong>Quelle IA utilise Philomène ?</strong><br>
  Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>, la version la plus avancée d’OpenAI.</p>
  <p><strong>Comment fonctionnent les tokens ?</strong><br>
  Chaque question + réponse consomment un petit nombre de tokens selon leur longueur.
  Le diamant 💎 affiche votre solde.</p>
  <p><strong>Packs disponibles :</strong><br>
  💎 1 000 000 tokens → 5€<br>
  💎 2 000 000 tokens → 10€<br>
  💎 4 000 000 tokens → 20€<br>
  🎁 Premier achat : <strong>+50 % offerts</strong>.</p>`;
  openPopup(html);
  menuSheet.classList.add('hidden');
});

// ===== PLACEHOLDER Connexion / Acheter =====
loginBtn.addEventListener('click', ()=>{
  openPopup("Connexion : lier ton compte (placeholder).");
});
buyBtn.addEventListener('click', ()=>{
  const html = `Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ <strong>(+50% au 1er achat)</strong>.`;
  openPopup(html);
});

// ===== ATTACH SHEET (+) =====
plusBtn.addEventListener('click', ()=>{
  attachSheet.classList.toggle('hidden');
});
closeAttach.addEventListener('click', ()=>attachSheet.classList.add('hidden'));

pickPhoto.addEventListener('click', ()=>imgLibInput.click());
takePhoto.addEventListener('click', ()=>imgCamInput.click());
pickFile .addEventListener('click', ()=>docInput.click());

// -> envoi image (photothèque / caméra)
async function sendImage(file){
  if(!file) return;
  setTyping(true);
  try{
    const fd = new FormData();
    fd.append("image", file);
    const resp = await fetch(API_IMG, {method:"POST", body:fd});
    const data = await resp.json().catch(()=>null);
    setTyping(false);
    addMessage(data?.answer || "Image reçue ✅ (stub).", 'bot');
    // estimer coût
    tokenCount = Math.max(0, tokenCount - 50);
    tokenCountEl.textContent = tokenCount.toLocaleString('fr-FR');
  }catch(e){
    setTyping(false);
    addMessage("Erreur lors de l’envoi de l’image.", 'bot');
  }finally{
    attachSheet.classList.add('hidden');
  }
}
imgLibInput.addEventListener('change', e=> sendImage(e.target.files?.[0]));
imgCamInput.addEventListener('change', e=> sendImage(e.target.files?.[0]));

// -> envoi document
docInput.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  if(!f) return;
  setTyping(true);
  try{
    const fd = new FormData();
    fd.append("file", f);
    fd.append("prompt","Analyse ce fichier et résume.");
    const resp = await fetch(API_IMG, {method:"POST", body:fd});
    const data = await resp.json().catch(()=>null);
    setTyping(false);
    addMessage(data?.answer || "Fichier reçu ✅ (stub).", 'bot');
    tokenCount = Math.max(0, tokenCount - 40);
    tokenCountEl.textContent = tokenCount.toLocaleString('fr-FR');
  }catch(e){
    setTyping(false);
    addMessage("Erreur lors de l’envoi du fichier.", 'bot');
  }finally{
    attachSheet.classList.add('hidden');
  }
});

// ===== ENVOI TEXTE =====
async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;
  addMessage(text,'user');
  userInput.value = "";

  setTyping(true);
  try{
    // Si tu as une API maison, remplace ici:
    // POST {prompt, conversation}
    const resp = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ prompt:text, conversation })
    });
    const data = await resp.json().catch(()=>null);
    setTyping(false);
    const answer = data?.answer || "Bien reçu. Pose-moi la suite !";
    addMessage(answer,'bot');

    conversation.push({role:'user', content:text});
    conversation.push({role:'assistant', content:answer});

    // tokens (demo)
    const est = 20 + Math.ceil(answer.length/12);
    tokenCount = Math.max(0, tokenCount - est);
    tokenCountEl.textContent = tokenCount.toLocaleString('fr-FR');
  }catch(e){
    setTyping(false);
    addMessage("Oups, le service est indisponible pour le moment.", 'bot');
  }
}
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage(); }});

// ===== MICRO (placeholder) =====
micBtn.addEventListener('click', ()=>{
  openPopup("Micro : dictée vocale (placeholder).");
});

// ===== Focus: garder la barre en bas sous clavier iOS/Android =====
window.addEventListener('resize', ()=>{
  // on force le scroll en bas quand le clavier s’ouvre
  window.scrollTo(0, document.body.scrollHeight);
});
