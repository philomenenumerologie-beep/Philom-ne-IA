/* ===== CONFIG ===== */
const API_URL = ""; // <- mets ton endpoint ici (ex: "https://api.philomeneia.com/ask")
const FALLBACK_URL = "/ask"; // fallback si API_URL vide
const VERSION = "version 1.2"; // affiché sous le header

/* ===== Sélecteurs ===== */
const chat      = document.getElementById("chat");
const messages  = document.getElementById("messages");
const input     = document.getElementById("userInput");
const sendBtn   = document.getElementById("sendBtn");
const plusBtn   = document.getElementById("plusBtn");
const sheet     = document.getElementById("attachSheet");
const sheetClose= document.getElementById("closeSheet");
const pickLibrary = document.getElementById("pickLibrary");
const takePhoto   = document.getElementById("takePhoto");
const pickFile    = document.getElementById("pickFile");
const imgLibraryInput = document.getElementById("imgLibraryInput");
const imgCameraInput  = document.getElementById("imgCameraInput");
const docInput        = document.getElementById("docInput");
const micBtn   = document.getElementById("micBtn");
const tokenCountEl = document.getElementById("tokenCount");

const btnMenu  = document.getElementById("btnMenu");
const dropdown = document.getElementById("menuDropdown");
const toggleTheme = document.getElementById("toggleTheme");
const openFaq  = document.getElementById("openFaq");
const btnLogin = document.getElementById("btnLogin");
const btnBuy   = document.getElementById("btnBuy");

document.getElementById("appVersion").textContent = VERSION;

/* ===== Utilitaires UI ===== */
function addBubble(text, who="bot"){
  const wrap = document.createElement("div");
  wrap.className = `bubble ${who}`;
  wrap.innerHTML = `<div class="bubble__content"></div>`;
  wrap.querySelector(".bubble__content").textContent = text;
  messages.appendChild(wrap);
  requestAnimationFrame(() => chat.scrollTop = chat.scrollHeight);
}
function setTyping(on){
  if(on){
    addBubble("…", "bot"); // mini indicator (remplacé par la réponse)
  }else{
    // supprime le dernier "…" s'il existe
    const kids = messages.querySelectorAll(".bubble.bot .bubble__content");
    for(let i=kids.length-1;i>=0;i--){
      if(kids[i].textContent === "…"){ kids[i].closest(".bubble").remove(); break; }
    }
  }
}
function pop(text, title="Info"){
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = text;
  modal.showModal();
}
document.getElementById("modalClose").onclick = () => document.getElementById("modal").close();

/* ===== Menu ===== */
btnMenu.addEventListener("click", () => {
  dropdown.hidden = !dropdown.hidden;
});
document.addEventListener("click", (e)=>{
  if(!dropdown.hidden){
    const within = e.target.closest("#menuDropdown") || e.target.closest("#btnMenu");
    if(!within) dropdown.hidden = true;
  }
});
toggleTheme.addEventListener("click", ()=>{
  const body = document.body;
  const light = body.classList.toggle("theme-light");
  if(light){ body.classList.remove("theme-dark"); } else { body.classList.add("theme-dark"); }
});
openFaq.addEventListener("click", ()=>{
  dropdown.hidden = true;
  pop(`
    <div class="faq">
      <p><strong>Quelle IA utilise Philomène ?</strong><br/>
      Philomène I.A. est propulsée par <strong>GPT-5 Thinking</strong>, la version la plus avancée d’OpenAI.</p>

      <p><strong>Comment fonctionnent les tokens ?</strong><br/>
      Chaque question + réponse consomme un petit nombre de tokens selon leur longueur. Le diamant 💎 affiche votre solde.</p>

      <p><strong>Packs disponibles :</strong><br/>
      💎 1 000 000 tokens → 5 €<br/>
      💎 2 000 000 tokens → 10 €<br/>
      💎 4 000 000 tokens → 20 €<br/>
      🎁 Premier achat : <strong>+50 % offerts</strong>.</p>

      <p><strong>Abonnement ?</strong><br/>Non. Vous payez uniquement ce que vous consommez.</p>

      <p><strong>Confidentialité</strong><br/>Vos échanges restent privés.</p>
    </div>
  `, "Foire aux questions");
});

/* ===== Connexion / Acheter (placeholders) ===== */
btnLogin.addEventListener("click", ()=> pop("Connexion : lier ton compte (placeholder).","Connexion"));
btnBuy.addEventListener("click", ()=> pop("Acheter des tokens : 1M=5€ • 2M=10€ • 4M=20€ (+50% au 1er achat).","Acheter"));

/* ===== Sheet Joindre ===== */
function openSheet(){ sheet.hidden = false; }
function closeSheet(){ sheet.hidden = true; }
plusBtn.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);

pickLibrary.addEventListener("click", ()=> imgLibraryInput.click());
takePhoto.addEventListener("click",  ()=> imgCameraInput.click());
pickFile.addEventListener("click",    ()=> docInput.click());

/* upload handlers — envoient l’élément et affichent l’accusé */
function handlePickedFile(file){
  if(!file) return;
  addBubble(`📎 Fichier reçu : ${file.name}`,"user");
  // Ici tu pourras appeler ton endpoint d’upload si besoin
  closeSheet();
}
imgLibraryInput.onchange = e => handlePickedFile(e.target.files?.[0]);
imgCameraInput.onchange  = e => handlePickedFile(e.target.files?.[0]);
docInput.onchange        = e => handlePickedFile(e.target.files?.[0]);

/* ===== Micro (Web Speech API si dispo) ===== */
let recognition = null;
if("webkitSpeechRecognition" in window){
  const R = window.webkitSpeechRecognition;
  recognition = new R();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.onresult = (e)=>{
    const txt = e.results[0][0].transcript;
    input.value = txt;
  };
}
micBtn.addEventListener("click", ()=>{
  if(recognition){ recognition.start(); }
  else{ pop("Le micro n’est pas supporté par ce navigateur.","Micro"); }
});

/* ===== Envoi message ===== */
async function sendMessage(){
  const text = input.value.trim();
  if(!text) return;
  addBubble(text,"user");
  input.value = "";
  setTyping(true);

  // Choix de l’URL (ton API si fournie, sinon fallback)
  const url = API_URL || FALLBACK_URL;

  try{
    let resp;
    if(url === FALLBACK_URL){
      // Fallback demo locale (réponse simple)
      await new Promise(r=>setTimeout(r, 400));
      resp = { ok:true, json: async()=>({ answer: "Bien reçu. Pose-moi la suite !" }) };
    }else{
      resp = await fetch(url, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ userId:"guest", prompt:text })
      });
    }

    const data = await resp.json();
    setTyping(false);

    if(data && (data.answer || data.output || data.text)){
      const answer = data.answer || data.output || data.text;
      addBubble(answer,"bot");
      // (décrémente un peu le compteur pour feedback visuel)
      try{
        const n = parseInt((tokenCountEl.textContent||"0").replace(/\s/g,""),10);
        tokenCountEl.textContent = (Math.max(0, n-27)).toLocaleString("fr-FR");
      }catch{}
    }else{
      addBubble("Réponse reçue mais vide.", "bot");
    }
  }catch(e){
    setTyping(false);
    addBubble("Erreur de connexion. Réessaie plus tard.", "bot");
    console.error(e);
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){ e.preventDefault(); sendMessage(); }
});

/* ===== Focus: toujours la zone en bas visible ===== */
const io = new IntersectionObserver(()=>{
  chat.scrollTop = chat.scrollHeight;
});
io.observe(document.getElementById("composer"));
