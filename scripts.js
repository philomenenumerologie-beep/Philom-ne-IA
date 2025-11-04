/* ===== CONFIG ===== */
const API_URL = "https://api.philomeneia.com";   // <- remplace si besoin
let tokenCount = 1_000_000;
let sending = false;       // verrou anti double envoi
let darkDefault = true;    // dark au démarrage

/* ===== DOM ===== */
const chatBody     = document.getElementById("chatBody");
const userInput    = document.getElementById("userInput");
const btnSend      = document.getElementById("btnSend");
const btnPlus      = document.getElementById("btnPlus");
const plusSheet    = document.getElementById("plusSheet");
const closeSheet   = document.getElementById("closeSheet");
const pickGallery  = document.getElementById("pickGallery");
const takePhotoBtn = document.getElementById("takePhoto");
const pickFileLbl  = document.getElementById("pickFile");
const imgLibrary   = document.getElementById("imgLibrary");
const imgCamera    = document.getElementById("imgCamera");

const btnMenu   = document.getElementById("btnMenu");
const menu      = document.getElementById("menu");
const toggleTheme = document.getElementById("toggleTheme");
const openFAQ     = document.getElementById("openFAQ");
const openAbout   = document.getElementById("openAbout");

const btnLogin  = document.getElementById("btnLogin");
const btnBuy    = document.getElementById("btnBuy");
const tokenCountEl = document.getElementById("tokenCount");

const modal       = document.getElementById("modal");
const modalTitle  = document.getElementById("modalTitle");
const modalContent= document.getElementById("modalContent");
const modalActions= document.getElementById("modalActions");
const modalClose  = document.getElementById("modalClose");

/* ===== Helpers UI ===== */
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
function scrollToBottom() {
  requestAnimationFrame(()=>{
    const chat = document.getElementById("chat");
    chat.scrollTo({top: chat.scrollHeight + 1000, behavior: "smooth"});
  });
}
function addMessage(text, role="bot"){
  const div = document.createElement("div");
  div.className = "msg" + (role==="user" ? " user" : "");
  div.textContent = text;
  chatBody.appendChild(div);
  scrollToBottom();
}
function setTyping(on){
  if(on){
    typingEl = document.createElement("div");
    typingEl.className = "msg";
    typingEl.id = "typing";
    typingEl.textContent = "Philomène écrit…";
    chatBody.appendChild(typingEl);
  }else{
    const t = document.getElementById("typing");
    if(t) t.remove();
  }
  scrollToBottom();
}
function setSending(on){
  sending = on;
  btnSend.disabled = on;
}

/* ===== Sheet (+) ===== */
btnPlus.addEventListener("click", ()=> { plusSheet.hidden = false; });
closeSheet.addEventListener("click", ()=> { plusSheet.hidden = true; });
plusSheet.addEventListener("click", (e)=>{ if(e.target===plusSheet) plusSheet.hidden=true; });

pickGallery.addEventListener("click", ()=> imgLibrary.click());
imgLibrary.addEventListener("change", ()=>{
  if(imgLibrary.files?.[0]) addMessage("📷 Image ajoutée (placeholder).", "user");
  plusSheet.hidden = true;
});
takePhotoBtn.addEventListener("click", ()=> imgCamera.click());
imgCamera.addEventListener("change", ()=>{
  if(imgCamera.files?.[0]) addMessage("📸 Photo prise (placeholder).", "user");
  plusSheet.hidden = true;
});
pickFileLbl.addEventListener("change", ()=>{
  if(pickFileLbl.files?.[0]) addMessage("🗂️ Fichier joint (placeholder).", "user");
  plusSheet.hidden = true;
});

/* ===== Menu ===== */
btnMenu.addEventListener("click", (e)=>{
  e.stopPropagation();
  menu.hidden = !menu.hidden;
  const r = btnMenu.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.top = (r.bottom + 8) + "px";
  menu.style.left = (r.right - 200) + "px";
});
document.addEventListener("click",()=> menu.hidden = true);

toggleTheme.addEventListener("click", ()=>{
  const body = document.body;
  const isDark = body.classList.contains("theme-dark");
  if(isDark){ body.classList.remove("theme-dark"); body.classList.add("theme-light"); }
  else      { body.classList.remove("theme-light"); body.classList.add("theme-dark"); }
  menu.hidden = true;
});

openFAQ.addEventListener("click", ()=>{
  showModal("Foire aux questions", `
    <p><strong>Quelle IA utilise Philomène ?</strong><br/>
    Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>.</p>
    <p><strong>Comment fonctionnent les tokens ?</strong><br/>
    Chaque question + réponse consomment un petit nombre de tokens selon leur longueur. Le diamant 💎 affiche votre solde.</p>
    <p><strong>Packs disponibles :</strong><br/>
    💎 1 000 000 → 5 € • 💎 2 000 000 → 10 € • 💎 4 000 000 → 20 €<br/>
    <em>Premier achat : +50 % offerts.</em></p>
  `, [{label:"Fermer"}]);
  menu.hidden = true;
});

openAbout.addEventListener("click", ()=>{
  showModal("À propos", `
    <p><strong>Philomène I.A.</strong> — version 1.3</p>
    <p>Interface inspirée du style ChatGPT, avec glow violet.</p>
  `,[{label:"Fermer"}]);
  menu.hidden = true;
});

/* ===== Modale générique ===== */
function showModal(title, html, actions=[]){
  modalTitle.textContent = title;
  modalContent.innerHTML = html;
  modalActions.innerHTML = "";
  actions.forEach(a=>{
    const b = document.createElement("button");
    b.className = "btn" + (a.primary ? " primary": "");
    b.textContent = a.label;
    b.addEventListener("click", ()=>{
      a.onClick?.(); hideModal();
    });
    modalActions.appendChild(b);
  });
  modal.hidden = false;
}
function hideModal(){ modal.hidden = true; }
modalClose.addEventListener("click", hideModal);
modal.addEventListener("click", (e)=>{ if(e.target===modal) hideModal(); });

/* ===== Connexion / Acheter (placeholders + hooks) ===== */
btnLogin.addEventListener("click", ()=>{
  showModal("Connexion", `
    <p>Connecte ton compte pour sauvegarder l’historique et ton solde.</p>
  `, [
    {label:"Se connecter", primary:true, onClick: ()=> {
      // Hook d’intégration :
      window.onLoginSuccess?.({ userId: "demo_"+Math.random().toString(36).slice(2,8) });
    }},
    {label:"Fermer"}
  ]);
});
btnBuy.addEventListener("click", ()=>{
  showModal("Acheter des tokens", `
    <p>Choisis ton pack :</p>
    <ul>
      <li>💎 1 000 000 → 5 €</li>
      <li>💎 2 000 000 → 10 €</li>
      <li>💎 4 000 000 → 20 € <em>(+50% au 1er achat)</em></li>
    </ul>
  `, [
    {label:"Payer (placeholder)", primary:true, onClick: ()=>{
      // Hook d’intégration :
      const bonus = 0; // applique ton calcul si 1er achat
      tokenCount += 1_000_000 + bonus;
      updateTokenDisplay();
      window.onPayballSuccess?.({ pack:"1M", amount:5 });
    }},
    {label:"Fermer"}
  ]);
});
function updateTokenDisplay(){
  tokenCountEl.textContent = tokenCount.toLocaleString("fr-FR");
}

/* ===== Chat / API ===== */
const history = []; // {role:'user'|'assistant', content:string}

btnSend.addEventListener("click", sendFromInput);
userInput.addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){ e.preventDefault(); sendFromInput(); }
});
userInput.addEventListener("focus", scrollToBottom);

async function sendFromInput(){
  const text = userInput.value.trim();
  if(!text || sending) return;
  userInput.value = "";
  addMessage(text, "user");
  history.push({role:"user", content:text});
  await sendMessage(text);
}

async function sendMessage(text){
  try{
    setSending(true);
    setTyping(true);

    // Appel API
    const resp = await fetch(`${API_URL}/ask`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        userId: localStorage.getItem("ph_user") || "guest_"+getOrSetGuestId(),
        message: text,
        history: history.slice(-10)
      })
    });

    const ok = resp.ok;
    const data = ok ? await resp.json() : null;

    setTyping(false);
    setSending(false);

    if(ok && data && (data.answer || data.message)){
      const answer = data.answer || data.message;
      addMessage(answer, "bot");
      history.push({role:"assistant", content:answer});

      // Décompte (estimation légère)
      const estOut = Math.max(30, Math.ceil((answer.length)/4));
      tokenCount = Math.max(0, tokenCount - estOut);
      updateTokenDisplay();
    }else{
      addMessage("Désolé, le service est momentanément indisponible. Réessaie dans un instant.", "bot");
    }
  }catch(err){
    setTyping(false);
    setSending(false);
    addMessage("Oups, problème réseau. Vérifie ta connexion et réessaie.", "bot");
  }finally{
    scrollToBottom();
  }
}
function getOrSetGuestId(){
  let id = localStorage.getItem("ph_guest");
  if(!id){ id = Math.random().toString(36).slice(2,10); localStorage.setItem("ph_guest", id); }
  return id;
}

/* ===== INIT ===== */
(function init(){
  // Thème par défaut : sombre
  document.body.classList.toggle("theme-dark", darkDefault);
  document.body.classList.toggle("theme-light", !darkDefault);

  updateTokenDisplay();
  addMessage("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
  scrollToBottom();
})();
