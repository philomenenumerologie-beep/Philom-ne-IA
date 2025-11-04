// ===== CONFIG =====
const API_URL = "https://api.philomeneia.com/ask";
const API_IMG = "https://api.philomeneia.com/analyze-image"; // déjà en place dans ton backend
let tokenCount = 1_000_000; // visible à côté du 💎
let darkMode = true;
let recognition = null;

const userId = "guest_" + Math.random().toString(36).slice(2,10);
let conversation = [];

// ===== DOM =====
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const photoButton = document.getElementById("photoButton");
const docButton = document.getElementById("docButton");
const docPicker = document.getElementById("docPicker");
const tokenCountEl = document.getElementById("tokenCount");
const toggleMode = document.getElementById("toggle-mode");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const openFAQ = document.getElementById("openFAQ");
const faqPopup = document.getElementById("faqPopup");
const closeFAQ = document.getElementById("closeFAQ");
const resetChat = document.getElementById("resetChat");

// ===== UI helpers =====
function addMessage(content, sender="bot", cls=""){
  const msg = document.createElement("div");
  msg.className = `message ${sender} ${cls}`;
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function setTyping(on){
  if(on){ addMessage("…", "bot", "typing"); }
  else{
    const last = chatBox.querySelector(".typing");
    if(last) last.remove();
  }
}
function updateTokenDisplay(){
  tokenCountEl.textContent = tokenCount.toLocaleString("fr-FR");
  tokenCountEl.style.color = tokenCount < 5_000 ? "#ff6666" : "#b085ff";
}

// ===== SEND MESSAGE (réel + usage tokens) =====
async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;

  addMessage(text, "user");
  userInput.value = "";
  // Estimation entrée (secours si usage non renvoyé)
  const estIn = Math.ceil(text.length/4);
  tokenCount -= estIn;
  updateTokenDisplay();

  setTyping(true);
  try{
    const resp = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        userId,
        conversation: [...conversation, {role:"user", content:text}]
      })
    });
    const data = await resp.json();
    setTyping(false);

    if(!data || !data.answer){
      addMessage("Erreur : aucune réponse reçue.", "bot");
      return;
    }

    addMessage(data.answer, "bot");

    // Décompte réel si dispo (OpenAI usage)
    if(data.usage && typeof data.usage.total_tokens === "number"){
      tokenCount -= Math.max(0, data.usage.total_tokens - estIn);
    } else {
      // Estimation sortie (fallback)
      const estOut = Math.ceil(data.answer.length/4);
      tokenCount -= estOut;
    }
    updateTokenDisplay();

    // Mémorisation locale
    conversation.push({role:"user", content:text});
    conversation.push({role:"assistant", content:data.answer});
  }catch(e){
    setTyping(false);
    addMessage("Erreur de connexion au serveur.", "bot");
  }
}

// ===== JOUR/NUIT =====
toggleMode.addEventListener("click", ()=>{
  darkMode = !darkMode;
  document.body.classList.toggle("light-mode", !darkMode);
});

// ===== MENU =====
menuButton.addEventListener("click", ()=> menu.classList.toggle("hidden"));

// ===== FAQ =====
openFAQ.addEventListener("click", ()=>{
  faqPopup.classList.remove("hidden");
  menu.classList.add("hidden");
});
closeFAQ.addEventListener("click", ()=> faqPopup.classList.add("hidden"));

// ===== RESET CHAT =====
resetChat.addEventListener("click", ()=>{
  conversation = [];
  chatBox.innerHTML = "";
  addMessage("Nouvelle discussion commencée.", "bot");
  menu.classList.add("hidden");
});

// ===== ENVOI =====
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendMessage(); });

// ===== MICRO =====
micButton.addEventListener("click", ()=>{
  if(!("webkitSpeechRecognition" in window)){
    alert("La reconnaissance vocale n’est pas supportée sur ce navigateur.");
    return;
  }
  if(recognition){
    recognition.stop(); recognition = null; micButton.textContent = "🎤";
  }else{
    recognition = new webkitSpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.onresult = e => { userInput.value = e.results[0][0].transcript; };
    recognition.onend = ()=> { micButton.textContent = "🎤"; };
    recognition.start();
    micButton.textContent = "🛑";
  }
});

// ===== PHOTO = Recherche d’images web directe =====
photoButton.addEventListener("click", ()=>{
  const q = userInput.value.trim() || "Photo";
  const url = "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);
  window.open(url, "_blank");
});

// ===== DOCUMENT / IMAGE (envoi serveur -> analyze-image) =====
docButton.addEventListener("click", ()=> docPicker.click());
docPicker.addEventListener("change", async ()=>{
  if(!docPicker.files || !docPicker.files[0]) return;
  const file = docPicker.files[0];

  const form = new FormData();
  form.append("image", file);        // le backend attend "image"
  form.append("userId", userId);
  form.append("prompt", "Analyse ce fichier / cette image et réponds clairement.");

  setTyping(true);
  try{
    const resp = await fetch(API_IMG, { method:"POST", body: form });
    const data = await resp.json();
    setTyping(false);

    if(data && data.answer){
      addMessage(data.answer, "bot");
      // estimation coût sortie si usage non dispo côté /analyze-image
      const estOut = Math.ceil(data.answer.length/4);
      tokenCount -= estOut;
      updateTokenDisplay();
      conversation.push({role:"assistant", content:data.answer});
    }else{
      addMessage("Fichier reçu mais pas de réponse.", "bot");
    }
  }catch(e){
    setTyping(false);
    addMessage("Erreur lors de l’envoi du fichier.", "bot");
  }finally{
    docPicker.value = "";
  }
});

// ===== INIT =====
addMessage("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
updateTokenDisplay();
<script>
(() => {
  // ===== Sélecteurs
  const plusBtn = document.getElementById('phPlusBtn');
  const sendBtn = document.getElementById('phSendBtn');
  const micBtn  = document.getElementById('phMicBtn');
  const input   = document.getElementById('phMessage');

  const sheet = document.getElementById('phSheet');
  const sheetBg = document.getElementById('phSheetBackdrop');
  const sheetCancel = document.getElementById('phSheetCancel');
  const pickPhoto = document.getElementById('phPickPhoto');
  const takePhoto = document.getElementById('phTakePhoto');
  const pickFile  = document.getElementById('phPickFile');

  const imgLibInput = document.getElementById('phImageLibraryInput');
  const imgCamInput = document.getElementById('phImageCameraInput');
  const docInput    = document.getElementById('phDocInput');

  // ===== Helpers Sheet
  function openSheet(){
    sheet.hidden = false; sheetBg.hidden = false;
  }
  function closeSheet(){
    sheet.hidden = true; sheetBg.hidden = true;
  }

  plusBtn?.addEventListener('click', openSheet);
  sheetBg?.addEventListener('click', closeSheet);
  sheetCancel?.addEventListener('click', closeSheet);

  // ===== Actions du menu
  pickPhoto?.addEventListener('click', () => { closeSheet(); imgLibInput.click(); });
  takePhoto?.addEventListener('click', () => { closeSheet(); imgCamInput.click(); });
  pickFile?.addEventListener('click',  () => { closeSheet(); docInput.click(); });

  // ===== Envoi (texte)
  sendBtn?.addEventListener('click', () => {
    const text = (input.value || '').trim();
    if(!text) return;
    if(typeof window.sendMessage === 'function'){          // si tu as déjà un handler
      window.sendMessage(text);
    }else{
      // Fallback minimal vers ton backend
      fetch('https://api.philomeneia.com/ask', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId: 'guest', conversation: [{role:'user', content: text}] })
      }).catch(()=>{});
    }
    input.value = '';
  });

  // ===== Micro intégré (dictée → append dans l’input)
  let rec, listening = false;
  function startRec(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ alert("La dictée n'est pas supportée sur ce navigateur."); return; }
    rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e) => {
      let txt = '';
      for(let i=0;i<e.results.length;i++){ txt += e.results[i][0].transcript; }
      input.value = (input.value ? input.value + ' ' : '') + txt.trim();
    };
    rec.onend = () => { listening=false; micBtn.classList.remove('ph-rec'); };
    rec.start(); listening=true; micBtn.classList.add('ph-rec');
  }
  function stopRec(){ try{ rec && rec.stop(); }catch(e){} }

  micBtn?.addEventListener('click', () => {
    if(listening) stopRec(); else startRec();
  });

  // ===== Uploads (tu plugges ici tes fonctions existantes)
  async function fileToDataURL(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  async function handleImage(file){
    // Si tu as déjà un handler existant, remplace par window.handleImage(file) etc.
    const dataUrl = await fileToDataURL(file);
    // Exemple : POST vers /analyze-image (si présent côté backend)
    fetch('https://api.philomeneia.com/analyze-image', {
      method:'POST',
      body: (() => {
        const fd = new FormData();
        fd.append('userId','guest');
        fd.append('prompt', 'Analyse cette image.');
        fd.append('image', file, file.name || 'image.jpg');
        return fd;
      })()
    }).catch(()=>{});
  }

  async function handleDoc(file){
    // À remplacer par ton upload/stockage réel
    // Pour l’instant on place juste un nom dans l’input
    input.value = (input.value ? input.value + ' ' : '') + `[Fichier: ${file.name}]`;
  }

  imgLibInput?.addEventListener('change', e => {
    const f = e.target.files?.[0]; if(f) handleImage(f);
    e.target.value = '';
  });
  imgCamInput?.addEventListener('change', e => {
    const f = e.target.files?.[0]; if(f) handleImage(f);
    e.target.value = '';
  });
  docInput?.addEventListener('change', e => {
    const f = e.target.files?.[0]; if(f) handleDoc(f);
    e.target.value = '';
  });

})();
</script>
