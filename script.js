// ====== CONFIG ======
const API_ASK = "https://api.philomeneia.com/ask";
const API_IMG = "https://api.philomeneia.com/analyze-image";

// ====== ÉTAT ======
let userId = localStorage.getItem("philo_uid");
if (!userId){ userId = "u_" + Math.random().toString(36).slice(2,10); localStorage.setItem("philo_uid", userId); }

let tokenCount = +(localStorage.getItem("philo_tokens") || 1000000); // solde visible
let conversation = []; // affichage (la vraie mémoire est côté serveur)

// ====== DOM ======
const chatBox   = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn   = document.getElementById("sendBtn");
const micBtn    = document.getElementById("micBtn");
const photoBtn  = document.getElementById("photoBtn");
const docBtn    = document.getElementById("docBtn");
const photoFile = document.getElementById("photoFile");
const docFile   = document.getElementById("docFile");
const tokenCountEl = document.getElementById("tokenCount");
const menuBtn   = document.getElementById("menuBtn");
const menu      = document.getElementById("menu");
const toggleMode= document.getElementById("toggleMode");
const faq       = document.getElementById("faq");
const openFAQ   = document.getElementById("openFAQ");
const faqClose  = document.getElementById("faqClose");
const newChat   = document.getElementById("newChat");

// ====== UI helpers ======
function scrollBottom(){ setTimeout(()=>{ chatBox.scrollTop = chatBox.scrollHeight; }, 30); }

function addMsg(text, who="bot", cls=""){
  const div = document.createElement("div");
  div.className = `msg ${who} ${cls}`.trim();
  div.textContent = text;
  chatBox.appendChild(div);
  scrollBottom();
  return div;
}

function typingOn(){ return addMsg("…", "bot", "typing"); }
function typingOff(node){ if(node && node.parentNode) node.parentNode.removeChild(node); }

function updateTokensDisplay(){
  tokenCountEl.textContent = tokenCount.toLocaleString("fr-FR");
  localStorage.setItem("philo_tokens", String(tokenCount));
}

function approxTokensFromText(s){ return Math.max(1, Math.ceil((s||"").length/4)); } // ~1 token ≈ 4 chars

// filtre anti-message parasite (abonnement YouTube)
function sanitizeAnswer(text){
  const banned = [/merci d'avoir regardé/i, /abonne[- ]?toi/i, /n.h.site pas .* t.abonner/i];
  return banned.some(r=>r.test(text)) ? "" : text;
}

// ====== ENVOI TEXTE ======
async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;

  addMsg(text, "user");
  userInput.value = "";

  // Débit (approx) à l'envoi
  tokenCount -= approxTokensFromText(text);
  updateTokensDisplay();

  const tnode = typingOn();

  try{
    const resp = await fetch(API_ASK, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        userId,
        conversation: [...conversation, {role:"user", content:text}]
      })
    });

    const data = await resp.json();
    typingOff(tnode);

    if(!data || !data.answer){
      addMsg("Désolée, j'ai eu un problème réseau.", "bot");
      return;
    }

    let answer = sanitizeAnswer(data.answer.trim());
    if (!answer) answer = "…";

    addMsg(answer, "bot");

    // Débit (approx) à la réponse. Si le backend fournit usage, on l'utilise.
    if (data.usage && (data.usage.prompt_tokens || data.usage.completion_tokens)){
      const used = (data.usage.prompt_tokens||0) + (data.usage.completion_tokens||0);
      tokenCount = Math.max(0, tokenCount - used);  // vrai décompte si dispo
    } else {
      tokenCount -= approxTokensFromText(answer);    // fallback
    }
    updateTokensDisplay();

    conversation.push({role:"user", content:text});
    conversation.push({role:"assistant", content:answer});
  }catch(e){
    typingOff(tnode);
    addMsg("Désolée, j'ai eu un problème réseau.", "bot");
  }
}

// ====== ANALYSE IMAGE ======
async function sendImage(file){
  if(!file) return;
  const t = typingOn();

  try{
    const fd = new FormData();
    fd.append("image", file);
    fd.append("userId", userId);
    fd.append("prompt", "Analyse cette image et explique clairement ce que tu vois.");

    const resp = await fetch(API_IMG, { method:"POST", body: fd });
    const data = await resp.json();
    typingOff(t);

    if(data && data.answer){
      addMsg(data.answer, "bot");
      // décompte approx (la vraie conso image dépend du modèle, on ajuste ici)
      tokenCount -= approxTokensFromText(data.answer) + 200; // petit forfait image
      updateTokensDisplay();
    } else {
      addMsg("Impossible d'analyser l'image.", "bot");
    }
  }catch(e){
    typingOff(t);
    addMsg("Erreur envoi image.", "bot");
  }
}

// ====== MICRO ======
let recognition;
micBtn.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)){ alert("Reconnaissance vocale non supportée."); return; }
  if (recognition){ recognition.stop(); recognition = null; micBtn.textContent="🎤"; return; }
  recognition = new webkitSpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.onresult = (e)=>{ userInput.value = e.results[0][0].transcript; };
  recognition.onend = ()=>{ micBtn.textContent="🎤"; };
  recognition.start();
  micBtn.textContent="🛑";
});

// ====== EVENTS ======
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendMessage(); });

menuBtn.addEventListener("click", ()=> menu.classList.toggle("hidden"));
openFAQ.addEventListener("click", ()=>{ faq.classList.add("open"); faq.setAttribute("aria-hidden","false"); menu.classList.add("hidden"); });
faqClose.addEventListener("click", ()=>{ faq.classList.remove("open"); faq.setAttribute("aria-hidden","true"); });

faq.addEventListener("click", (e)=>{ if(e.target===faq){ faq.classList.remove("open"); faq.setAttribute("aria-hidden","true"); } });
window.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && faq.classList.contains("open")){ faq.classList.remove("open"); faq.setAttribute("aria-hidden","true"); } });

newChat.addEventListener("click", ()=>{
  conversation = [];
  chatBox.innerHTML = "";
  addMsg("Nouvelle discussion commencée.", "bot");
  menu.classList.add("hidden");
});

// Mode jour/nuit
toggleMode.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
});

// Boutons photo/document
photoBtn.addEventListener("click", ()=> photoFile.click());
docBtn.addEventListener("click", ()=> docFile.click());
photoFile.addEventListener("change", ()=> sendImage(photoFile.files[0]));
docFile.addEventListener("change", ()=> addMsg("📄 Envoi de documents (bientôt actif).", "bot"));

// ====== INIT ======
function init(){
  updateTokensDisplay();
  addMsg("Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.", "bot");
  // Toujours démarrer FAQ fermée
  faq.classList.remove("open"); faq.setAttribute("aria-hidden","true");
  menu.classList.add("hidden");
}
init();
