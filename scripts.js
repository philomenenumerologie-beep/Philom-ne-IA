// ====== Configuration ======
// Mets ici ton vrai endpoint si différent :
const API_URL = "https://api.philomeneia.com/ask";

// Etat
let tokenCount = 1_000_000; // affiché au diamant
let sending = false;

// Sélecteurs
const el = (id)=>document.getElementById(id);
const chatScroll = el('chatScroll');
const input      = el('userInput');
const sendBtn    = el('sendButton');
const plusBtn    = el('plusBtn');
const micBtn     = el('micBtn');
const tokenEl    = el('tokenCount');

// Menus / modals
const menuBtn = el('btnMenu'), menuSheet = el('menuSheet'), toggleMode = el('toggleMode'), openFaq = el('openFaq');
const faqModal = el('faqModal'), closeFaq = el('closeFaq');
const dialog = el('dialog'), dialogText = el('dialogText'), dialogClose = el('dialogClose');

// Attach sheet & inputs
const attachSheet = el('attachSheet'), closeAttach = el('closeAttach');
const pickPhoto = el('pickPhoto'), takePhoto = el('takePhoto'), pickFile = el('pickFile');
const imgLibInput = el('imgLibInput'), imgCamInput = el('imgCamInput'), docInput = el('docInput');

// Login / Buy
const btnLogin = el('btnLogin'), btnBuy = el('btnBuy');

// ====== UI helpers ======
const fmt = (n)=> n.toLocaleString('fr-FR');

function addBubble(text, who='bot'){
  const b = document.createElement('div');
  b.className = `bubble ${who}`;
  b.textContent = text;
  chatScroll.appendChild(b);
  chatScroll.scrollTop = chatScroll.scrollHeight;
}
function typing(v){
  if(v){ addBubble('…','bot'); }
}
function setTheme(mode){
  document.body.classList.toggle('light', mode==='light');
  document.body.classList.toggle('dark',  mode!=='light');
  localStorage.setItem('ph_theme', mode);
}
function initTheme(){
  const saved = localStorage.getItem('ph_theme');
  setTheme(saved || 'dark'); // Par défaut: sombre
}
function show(elm){ elm.setAttribute('aria-hidden','false'); }
function hide(elm){ elm.setAttribute('aria-hidden','true'); }

// ====== Menu ======
menuBtn.addEventListener('click', ()=>{
  const open = menuSheet.getAttribute('aria-hidden') === 'true';
  menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuSheet.setAttribute('aria-hidden', open ? 'false' : 'true');
});
toggleMode.addEventListener('click', ()=>{
  const nowLight = !document.body.classList.contains('light') ? 'light' : 'dark';
  setTheme(nowLight);
  hide(menuSheet);
});
openFaq.addEventListener('click', ()=>{ hide(menuSheet); show(faqModal); });
closeFaq.addEventListener('click', ()=> hide(faqModal));

// ====== Dialog helper ======
function notify(text){ dialogText.textContent = text; show(dialog); }
dialogClose.addEventListener('click', ()=> hide(dialog));

// ====== Login / Buy placeholders ======
btnLogin.addEventListener('click', ()=> notify('Connexion : lier ton compte (placeholder).'));
btnBuy.addEventListener('click',   ()=> notify('Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ (+50% au 1er achat).'));

// ====== Attach sheet ======
plusBtn.addEventListener('click', ()=> show(attachSheet));
closeAttach.addEventListener('click', ()=> hide(attachSheet));
pickPhoto.addEventListener('click', ()=> { imgLibInput.click(); });
takePhoto.addEventListener('click', ()=> { imgCamInput.click(); });
pickFile.addEventListener('click',  ()=> { docInput.click(); });

imgLibInput.addEventListener('change', onImagePicked);
imgCamInput.addEventListener('change', onImagePicked);
docInput.addEventListener('change', onFilePicked);

function onImagePicked(e){
  hide(attachSheet);
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  sendWithFile(f, 'Analyse cette image, décris ce que tu vois.');
}
function onFilePicked(e){
  hide(attachSheet);
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  sendWithFile(f, 'Analyse ce document.');
}

// ====== Speech to text ======
let recognition = null;
if ('webkitSpeechRecognition' in window){
  const R = window.webkitSpeechRecognition;
  recognition = new R(); recognition.lang = 'fr-FR'; recognition.interimResults = false;
  recognition.onresult = (e)=>{ input.value = e.results[0][0].transcript; };
}
micBtn.addEventListener('click', ()=>{
  if(!recognition){ notify('🎤 Dictée non disponible sur ce navigateur.'); return; }
  recognition.start();
});

// ====== Envoi texte ======
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
});

async function sendMessage(){
  const text = (input.value || '').trim();
  if(!text || sending) return;
  sending = true; sendBtn.disabled = true;

  addBubble(text, 'user'); input.value = ''; typing(true);

  const payload = {
    userId: localStorage.getItem('ph_uid') || 'guest_'+Math.random().toString(36).slice(2,8),
    prompt: text
  };

  await performFetch(payload);
}

async function sendWithFile(file, prompt){
  addBubble('📎 '+file.name, 'user'); typing(true);

  const form = new FormData();
  form.append('image', file);
  form.append('userId', localStorage.getItem('ph_uid') || 'guest_'+Math.random().toString(36).slice(2,8));
  form.append('prompt', prompt);

  await performFetch(form, true);
}

async function performFetch(body, isForm=false){
  const ctrl = new AbortController();
  const timeout = setTimeout(()=>ctrl.abort(), 20000);

  try{
    const r = await fetch(API_URL, {
      method:'POST',
      headers: isForm ? undefined : {'Content-Type':'application/json'},
      body: isForm ? body : JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(timeout);

    // retire le dernier "…" de typing
    const last = chatScroll.lastElementChild;
    if(last && last.textContent==='…') last.remove();

    if(!r.ok){ addBubble(`⚠️ Serveur indisponible (code ${r.status}).`,'bot'); }
    else{
      const data = await r.json().catch(()=> ({}));
      const answer = data?.answer || data?.message || data?.text || '🤔 Réponse vide du serveur.';
      addBubble(answer, 'bot');

      // MAJ compteur tokens si fourni
      const tin  = Number(data?.tokens_in || data?.prompt_tokens || 0);
      const tout = Number(data?.tokens_out || data?.completion_tokens || 0);
      if (Number.isFinite(tin+tout)){
        tokenCount = Math.max(0, tokenCount - Math.ceil(tin + tout));
        tokenEl.textContent = fmt(tokenCount);
      }
    }
  }catch(e){
    const last = chatScroll.lastElementChild;
    if(last && last.textContent==='…') last.remove();
    addBubble(e?.name === 'AbortError' ? '⏱️ Délai dépassé. Réessaie.' : '❌ Erreur réseau.', 'bot');
  }finally{
    sending = false; sendBtn.disabled = false;
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }
}

// ====== Init ======
initTheme();
addBubble('Bonjour 👋 Je suis Philomène I.A., propulsée par GPT-5 Thinking.', 'bot');
tokenEl.textContent = fmt(tokenCount);
