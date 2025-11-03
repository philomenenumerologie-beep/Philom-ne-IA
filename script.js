const API_URL = "https://api.philomeneia.com/ask";
const GUEST_START = 1_000_000;
let balance = GUEST_START;

const el = {
  chat: document.getElementById("chat"),
  input: document.getElementById("messageInput"),
  send: document.getElementById("sendBtn"),
  plus: document.getElementById("plusBtn"),
  panel: document.getElementById("attachPanel"),
  theme: document.getElementById("themeToggle"),
  balance: document.getElementById("tokenBalance"),
  burger: document.getElementById("burgerBtn"),
  menu: document.getElementById("burgerMenu"),
  openFaq: document.getElementById("openFaq"),
  faq: document.getElementById("faqModal"),
  faqClose: document.getElementById("faqClose"),
  newChat: document.getElementById("newChat"),
};

updateBalance(0);

// 🌙 Changement de thème
el.theme.addEventListener("click", () => {
  document.body.classList.toggle("theme-light");
  el.theme.textContent = document.body.classList.contains("theme-light") ? "☀️" : "🌙";
});

// 🍔 Menu burger
el.burger.addEventListener("click", () => {
  const isHidden = el.menu.hasAttribute("hidden");
  el.menu.toggleAttribute("hidden", !isHidden);
});
document.addEventListener("click", (e) => {
  if (!el.menu.hasAttribute("hidden") && !e.target.closest(".dropdown") && e.target !== el.burger)
    el.menu.setAttribute("hidden", "");
});

// ❓ FAQ
el.openFaq.addEventListener("click", () => {
  el.faq.showModal();
  el.menu.setAttribute("hidden", "");
});
el.faqClose.addEventListener("click", () => el.faq.close());

// 🔄 Nouvelle discussion
el.newChat.addEventListener("click", () => {
  el.chat.innerHTML = "";
  addMsg("Nouvelle discussion ouverte. Comment puis-je vous aider ?");
  el.input.focus();
  el.menu.setAttribute("hidden", "");
});

// ➕ Panneau des pièces jointes
el.plus.addEventListener("click", () => {
  const open = el.plus.getAttribute("aria-expanded") === "true";
  if (open) {
    el.panel.setAttribute("hidden", "");
    el.plus.setAttribute("aria-expanded", "false");
    el.plus.textContent = "＋";
  } else {
    el.panel.removeAttribute("hidden");
    el.plus.setAttribute("aria-expanded", "true");
    el.plus.textContent = "−";
  }
});

// 💬 Envoi de message
el.send.addEventListener("click", send);
el.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    send();
  }
});

function addMsg(text, who = "bot") {
  const b = document.createElement("div");
  b.className = `msg ${who}`;
  b.innerHTML = text;
  el.chat.appendChild(b);
  b.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function send() {
  const q = el.input.value.trim();
  if (!q) return;
  addMsg(escapeHTML(q), "user");
  el.input.value = "";

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q }),
    });

    await applyServerUsage(resp);
    const data = await resp.json();
    addMsg(escapeHTML(data.reply ?? "OK."));
  } catch (err) {
    console.error(err);
    addMsg("Désolé, j’ai eu un souci réseau. Réessaie 👍");
  }
}

// 🪙 Tokens : décompte
async function applyServerUsage(resp) {
  const h = resp.headers.get("x-tokens-used") || resp.headers.get("X-Tokens-Used");
  if (h && !Number.isNaN(+h)) {
    updateBalance(+h);
    return;
  }
}

function updateBalance(used) {
  if (used > 0) balance = Math.max(0, balance - used);
  el.balance.textContent = balance.toLocaleString("fr-FR");
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
