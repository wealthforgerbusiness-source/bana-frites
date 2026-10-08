import { getBioPanel } from "./firestore.js";

const loadingState = document.getElementById("loadingState");
const notFoundState = document.getElementById("notFoundState");
const panelState = document.getElementById("panelState");

const pNom = document.getElementById("pNom");
const pDescription = document.getElementById("pDescription");
const pLinksList = document.getElementById("pLinksList");

function toMillis(timestamp) {
  if (!timestamp) return null;
  return timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
}

function isPanelActive(data) {
  if (!data || data.active !== true) return false;
  const expiresMillis = toMillis(data.expiresAt);
  return expiresMillis !== null && expiresMillis > Date.now();
}

function showNotFound() {
  loadingState.hidden = true;
  notFoundState.hidden = false;
  panelState.hidden = true;
}

function renderPanel(data) {
  loadingState.hidden = true;
  notFoundState.hidden = true;
  panelState.hidden = false;

  pNom.textContent = data.nom || "";
  pDescription.textContent = data.description || "";

  while (pLinksList.firstChild) {
    pLinksList.removeChild(pLinksList.firstChild);
  }

  const liens = Array.isArray(data.liens) ? data.liens : [];

  liens.forEach((lien) => {
    if (!lien || typeof lien.url !== "string") return;

    // Sécurité : n'accepte que des URLs http:// ou https:// comme href
    if (!lien.url.startsWith("http://") && !lien.url.startsWith("https://")) {
      return;
    }

    const link = document.createElement("a");
    link.href = lien.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "p-link-btn";
    link.textContent = lien.titre || lien.url; // jamais innerHTML

    pLinksList.appendChild(link);
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("u");

  if (!uid) {
    showNotFound();
    return;
  }

  const result = await getBioPanel(uid);

  if (!result.success || !result.exists || !isPanelActive(result.data)) {
    showNotFound();
    return;
  }

  renderPanel(result.data);
}

init();
