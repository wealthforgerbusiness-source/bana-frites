import { onAuthChange } from "./auth.js";
import { auth } from "./firebase-config.js";

const loadingState = document.getElementById("loadingState");
const deniedState = document.getElementById("deniedState");
const deniedText = document.getElementById("deniedText");
const dashboardState = document.getElementById("dashboardState");
const statsGrid = document.getElementById("statsGrid");
const typeTableBody = document.getElementById("typeTableBody");
const recentTableBody = document.getElementById("recentTableBody");
const recentEmpty = document.getElementById("recentEmpty");
const refreshBtn = document.getElementById("refreshBtn");

const TYPE_LABELS = {
  message: "Message anonyme",
  phone: "Numéro matching",
  bio: "Panel bio",
};

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

function formatMoney(value, currency) {
  return `${numberFormat.format(value || 0)} ${currency || ""}`.trim();
}

function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function showOnly(state) {
  loadingState.hidden = state !== "loading";
  deniedState.hidden = state !== "denied";
  dashboardState.hidden = state !== "dashboard";
}

function showDenied(message) {
  deniedText.textContent = message;
  showOnly("denied");
}

function addCard(label, value) {
  const card = document.createElement("div");
  card.className = "admin-card";

  const labelEl = document.createElement("span");
  labelEl.className = "admin-card-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "admin-card-value";
  valueEl.textContent = value;

  card.appendChild(labelEl);
  card.appendChild(valueEl);
  statsGrid.appendChild(card);
}

function addRow(tbody, cells) {
  const tr = document.createElement("tr");
  cells.forEach((text) => {
    const td = document.createElement("td");
    td.textContent = text;
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

function render(stats) {
  const currency = stats.currency;

  clear(statsGrid);
  addCard("Utilisateurs inscrits", numberFormat.format(stats.users.total));
  addCard("Nouveaux (7 jours)", numberFormat.format(stats.users.new7d));
  addCard("Revenu net total", formatMoney(stats.payments.netTotal, currency));
  addCard("Revenu net (30 jours)", formatMoney(stats.payments.last30.net, currency));
  addCard("Paiements reçus", numberFormat.format(stats.payments.count));
  addCard("Panels bio actifs", numberFormat.format(stats.bio.activePanels));
  addCard("MRR estimé (panels)", formatMoney(stats.bio.mrr, currency));

  clear(typeTableBody);
  Object.keys(TYPE_LABELS).forEach((type) => {
    const data = stats.byType[type] || { count: 0, net: 0 };
    addRow(typeTableBody, [TYPE_LABELS[type], numberFormat.format(data.count), formatMoney(data.net, currency)]);
  });

  clear(recentTableBody);
  recentEmpty.hidden = stats.recent.length > 0;
  stats.recent.forEach((payment) => {
    const date = payment.createdAt ? new Date(payment.createdAt).toLocaleString("fr-FR") : "—";
    addRow(recentTableBody, [
      date,
      TYPE_LABELS[payment.type] || payment.type,
      formatMoney(payment.net, payment.currency || currency),
    ]);
  });

  showOnly("dashboard");
}

async function loadStats() {
  refreshBtn.disabled = true;

  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (res.status === 403) {
      showDenied("Cette page est réservée à l'administrateur.");
    } else if (!res.ok || !data.success) {
      showDenied(data.error || "Impossible de charger les statistiques.");
    } else {
      render(data);
    }
  } catch (error) {
    showDenied("Erreur réseau. Réessaie dans un instant.");
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadStats);

let started = false;
onAuthChange((user) => {
  if (started) return;
  started = true;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/admin.html");
    return;
  }

  loadStats();
});
