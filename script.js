// ====== Sélecteurs ======
const fabToggle = document.getElementById('fabToggle');
const fabMenu = document.getElementById('fabMenu');
const micBtn = document.getElementById('micBtn');
const camBtn = document.getElementById('camBtn');
const docBtn = document.getElementById('docBtn');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chat = document.querySelector('.chat');
const tokenEl = document.getElementById('tokenCounter');

let tokenBalance = Number((tokenEl?.textContent || '0').replace(/\s/g, ''));

// ===== MENU + =====
let fabOpen = false;
function toggleFab(open){
  fabOpen = open !== undefined ? open : !fabOpen;
  fabMenu.classList.toggle('open', fabOpen);
  fabToggle.textContent = fabOpen ? '−' : '+';
}
fabToggle.addEventListener('click', ()=> toggleFab());
document.addEventListener('click', e=>{
  if(!fabOpen) return;
  if(!e.target.closest('.fab-wrap')) toggleFab(false);
});

// ===== Actions menu =====
micBtn.addEventListener('click', ()=>{ alert('Micro activé (à brancher)'); toggleFab(false); });
camBtn.addEventListener('click', ()=>{ alert('Caméra (à brancher)'); toggleFab(false); });
docBtn.addEventListener('click', ()=>{ alert('Document (à brancher)'); toggleFab(false); });

// ===== Message =====
function addMessage(text, type='bot'){
  const div = document.createElement('div');
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ===== Estimation tokens =====
function estimateTokens(txt){
  return Math.max(1, Math.ceil(txt.length / 4));
}

// ===== Envoi =====
const API_URL = "https://api.philomeneia.com/ask";

async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;

  addMessage(text, 'user');
  userInput.value = '';
  toggleFab(false);

  let tokensLeft = null;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation: [{ role: "user", content: text }],
        tokens: tokenBalance
      })
    });
    const data = await res.json();
    addMessage(data.answer || "Erreur serveur.");
    if(typeof data.tokensLeft === "number") tokensLeft = data.tokensLeft;
  } catch(e) {
    addMessage("Connexion impossible pour le moment.");
  }

  // Décrément local si pas de retour serveur
  if (typeof tokensLeft === "number") {
    tokenBalance = Math.max(0, Math.floor(tokensLeft));
  } else {
    tokenBalance -= estimateTokens(text) + 50;
  }
  tokenEl.textContent = tokenBalance.toLocaleString('fr-FR');
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
