// ===========================
// CONFIG
// ===========================
const API_URL = "https://api.philomeneia.com/ask"; // ton proxy Render
const DEFAULT_USER = "guest";

// ===========================
// UI HELPERS
// ===========================
const $ = (sel) => document.querySelector(sel);

function setTokenCounter(n){
  const el = $("#tokenCounter");
  if (!el) return;
  try { el.textContent = new Intl.NumberFormat("fr-FR").format(Number(n||0)); }
  catch { el.textContent = String(n||0); }
}

// ===========================
// ÉTAT
// ===========================
let tokenBalance = 1_000_000;
let conversation = [{ role:"system", content:"Tu es Philomène I.A., claire et utile." }];

setTokenCounter(tokenBalance);

// ===========================
// TOP BAR actions
// ===========================
$("#menuBtn")?.addEventListener("click", (e)=>{
  e.stopPropagation();
  $("#menuPanel")?.classList.toggle("hidden");
});
document.addEventListener("click",(e)=>{
  const p = $("#menuPanel"), b = $("#menuBtn");
  if (p && !p.contains(e.target) && e.target !== b) p.classList.add("hidden");
});

$("#openFaq")?.addEventListener("click", ()=>{
  $("#menuPanel")?.classList.add("hidden");
  $("#faqModal")?.classList.remove("hidden");
});
$("#faqClose")?.addEventListener("click", ()=> $("#faqModal")?.classList.add("hidden"));
$("#newChat")?.addEventListener("click", resetConversation);

$("#themeBtn")?.addEventListener("click", ()=>{
  document.documentElement.classList.toggle("light"); // hook si tu veux un thème clair
});

// ===========================
// PLUS -> pile verticale
// ===========================
const plusBtn = $("#plusBtn");
const attachStack = $("#attachStack");
plusBtn?.addEventListener("click", (e)=>{
  e.stopPropagation();
  const open = attachStack.classList.toggle("hidden");
  plusBtn.textContent = open ? "+" : "−";
  plusBtn.setAttribute("aria-expanded", String(!open));
});
document.addEventListener("click",(e)=>{
  if (attachStack && !attachStack.contains(e.target) && e.target !== plusBtn){
    attachStack.classList.add("hidden");
    plusBtn.textContent = "+";
    plusBtn.setAttribute("aria-expanded","false");
  }
});

// (Placeholders des trois actions)
$("#attachMic")?.addEventListener("click", ()=> alert("Micro à brancher plus tard."));
$("#attachCam")?.addEventListener("click", ()=> alert("Caméra à brancher plus tard."));
$("#attachDoc")?.addEventListener("click", ()=> alert("Document à brancher plus tard."));

// ===========================
//
// ENVOI MESSAGE
//
// ===========================
const chat = $("#chat");
const input = $("#userInput");
$("#sendBtn")?.addEventListener("click", sendMessage);
input?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendMessage(); });

function appendMsg(role, text){
  const div = document.createElement("div");
  div.className = `msg ${role==="assistant"?"bot":"user"}`;
  div.innerHTML = text.replace(/\n/g,"<br/>");
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function resetConversation(){
  conversation = [{ role:"system", content:"Tu es Philomène I.A., claire et utile." }];
  chat.innerHTML = `<div class="msg bot">Nouvelle discussion. Pose ta question 🙂</div>`;
}

async function sendMessage(){
  const text = input.value.trim();
  if (!text) return;

  // UI
  appendMsg("user", text);
  input.value = "";

  // mémoire locale & requête
  conversation.push({ role:"user", content:text });

  try{
    const resp = await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        conversation,
        userId: DEFAULT_USER,
        tokens: tokenBalance
      })
    });

    if (!resp.ok) throw new Error("Erreur réseau");

    const data = await resp.json();
    const answer = data.answer || "Désolé, pas de réponse.";
    appendMsg("assistant", answer);

    // MAJ tokens (si backend renvoie tokensLeft)
    if (typeof data.tokensLeft === "number"){
      tokenBalance = data.tokensLeft;
    } else {
      // fallback soft : estimation locale (basse) pour éviter 0
      const est = Math.max(0, tokenBalance - 20 - Math.ceil(answer.length/20));
      tokenBalance = est;
    }
    setTokenCounter(tokenBalance);

    // mémoire
    conversation.push({ role:"assistant", content: answer });

  } catch(err){
    appendMsg("assistant", "Oups, problème réseau. Réessaie dans un instant.");
  }
}
