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
// ====== Sélecteurs robustes ======
const API_URL = (typeof API_URL !== 'undefined' && API_URL) ? API_URL : "https://api.philomeneia.com/ask";

const input =
  document.getElementById('userInput')
  || document.getElementById('messageInput')
  || document.querySelector('#inputContainer input, .input-row input, input[type="text"]');

const sendBtn =
  document.getElementById('sendButton')
  || document.getElementById('sendBtn')
  || document.querySelector('#inputContainer button[type="submit"], .input-row .send, .send-btn');

function setTypingSafe(v){
  try { if (typeof setTyping === 'function') setTyping(v); } catch(e){}
}
function addMessageSafe(text, who='bot'){
  try { 
    if (typeof addMessage === 'function') addMessage(text, who);
    else console.log(`[${who}]`, text);
  } catch(e){ console.log(text); }
}
function updateTokensSafe(deltaIn = 0, deltaOut = 0){
  try { 
    if (typeof updateTokenDisplay === 'function') updateTokenDisplay();
    if (typeof tokenCount !== 'undefined') {
      tokenCount = Math.max(0, tokenCount - Math.ceil(deltaIn + deltaOut));
      const el = document.getElementById('tokenCount') || document.querySelector('[data-token-count]');
      if (el) el.textContent = tokenCount.toLocaleString('fr-FR');
    }
  } catch(e){}
}

// ====== Envoi ======
let sending = false;

async function sendMessage(){
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text || sending) return;

  sending = true;
  sendBtn && (sendBtn.disabled = true);
  setTypingSafe(true);

  // message utilisateur dans le chat (si tu l’affiches côté front)
  try { if (typeof addMessage === 'function') addMessage(text, 'user'); } catch(e){}

  // construction payload (ajuste userId si besoin)
  const payload = {
    userId: (typeof userId !== 'undefined') ? userId : ('guest_' + Math.random().toString(36).slice(2,8)),
    prompt: text
  };

  // petit timeout de sécurité
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);

  try{
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(t);

    if (!resp.ok){
      addMessageSafe("⚠️ Impossible de joindre le serveur (code " + resp.status + ").", 'bot');
    }else{
      const data = await resp.json().catch(()=> ({}));
      const answer = data?.answer || data?.message || data?.text;

      if (answer){
        addMessageSafe(answer, 'bot');

        // maj tokens si le backend les renvoie
        const tin  = Number(data?.tokens_in  || data?.prompt_tokens  || 0);
        const tout = Number(data?.tokens_out || data?.completion_tokens || 0);
        updateTokensSafe(tin, tout);
      }else{
        addMessageSafe("🤔 Réponse vide du serveur.", 'bot');
      }
    }
  }catch(err){
    const msg = (err && err.name === 'AbortError')
      ? "⏱️ Délai dépassé. Réessaie."
      : "❌ Erreur réseau. Vérifie ta connexion.";
    addMessageSafe(msg, 'bot');
  }finally{
    setTypingSafe(false);
    sendBtn && (sendBtn.disabled = false);
    input.value = '';
    sending = false;
  }
}

// ====== Listeners (click + Enter) ======
sendBtn && sendBtn.addEventListener('click', sendMessage);
input && input.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});
</script>
