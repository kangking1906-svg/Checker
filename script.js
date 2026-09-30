const state = {
  length: 2,
  filter: "all",
  rows: []
};

const els = {
  results: document.getElementById("results"),
  amount: document.getElementById("amount"),
  charset: document.getElementById("charset"),
  search: document.getElementById("search"),
  total: document.getElementById("total"),
  available: document.getElementById("available"),
  unknown: document.getElementById("unknown"),
  toast: document.getElementById("toast")
};

document.querySelectorAll(".length").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".length").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.length = Number(btn.dataset.length);
  });
});

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.filter;
    render();
  });
});

document.getElementById("generate").addEventListener("click", generate);
document.getElementById("clear").addEventListener("click", () => {
  state.rows = [];
  render();
});
document.getElementById("copyAvailable").addEventListener("click", async () => {
  const names = state.rows.filter(r => r.status === "available").map(r => r.username);
  if (!names.length) return toast("No verified available usernames.");
  await navigator.clipboard.writeText(names.join("\n"));
  toast(`${names.length} usernames copied!`);
});
els.search.addEventListener("input", render);

function randomName(length, chars) {
  let result = "";
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

/*
  This demo intentionally does NOT pretend that a username is available.
  To connect a real platform, replace verifyUsername() with the platform's
  official API call from your server/backend.
*/
async function verifyUsername(username) {
  return "unknown";
}

async function generate() {
  const amount = Math.min(500, Math.max(1, Number(els.amount.value) || 50));
  const type = els.charset.value;
  const chars = type === "numbers" ? "0123456789" :
                type === "lettersNumbers" ? "abcdefghijklmnopqrstuvwxyz0123456789" :
                "abcdefghijklmnopqrstuvwxyz";

  const set = new Set();
  while (set.size < amount) set.add(randomName(state.length, chars));

  state.rows = [...set].map(username => ({ username, status: "unknown" }));
  render();

  // Verify through a legitimate backend/API when configured.
  for (let i = 0; i < state.rows.length; i++) {
    state.rows[i].status = await verifyUsername(state.rows[i].username);
    render();
  }
}

function render() {
  const query = els.search.value.trim().toLowerCase();
  let rows = state.rows.filter(r => r.username.toLowerCase().includes(query));
  if (state.filter !== "all") rows = rows.filter(r => r.status === state.filter);

  els.total.textContent = state.rows.length;
  els.available.textContent = state.rows.filter(r => r.status === "available").length;
  els.unknown.textContent = state.rows.filter(r => r.status === "unknown").length;

  if (!rows.length) {
    els.results.innerHTML = `<div class="empty"><div class="empty-icon">⌁</div><h3>No results</h3><p>Generate usernames or change your filters.</p></div>`;
    return;
  }

  els.results.innerHTML = rows.map((r, index) => `
    <div class="row">
      <div class="username">${escapeHtml(r.username)}</div>
      <div class="length">${r.username.length} chars</div>
      <div>
        <span class="status ${r.status}">
          ${r.status === "available" ? "✓ Available" : "⚠ Unable to verify"}
        </span>
      </div>
      <div><button class="copy" data-copy="${escapeAttr(r.username)}">Copy</button></div>
    </div>
  `).join("");

  document.querySelectorAll(".copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const old = btn.textContent;
      btn.textContent = "Copied!";
      toast("Username copied.");
      setTimeout(() => btn.textContent = old, 900);
    });
  });
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

render();
