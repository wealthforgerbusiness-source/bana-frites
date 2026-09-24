import { onAuthChange } from "./auth.js";
import { auth } from "./firebase-config.js";
import { getBioPanel, saveBioPanel } from "./firestore.js";

const MAX_LINKS = 4;
const RENEW_THRESHOLD_DAYS = 3;

let currentUser = null;

// --- Éléments DOM ---
const loadingState = document.getElementById("loadingState");
const contentState = document.getElementById("contentState");
const loadError = document.getElementById("loadError");

const notActiveScreen = document.getElementById("notActiveScreen");
const activateBtn = document.getElementById("activateBtn");
const activateError = document.getElementById("activateError");

const activeScreen = document.getElementById("activeScreen");
const bioShareLink = document.getElementById("bioShareLink");
const bioCopyBtn = document.getElementById("bioCopyBtn");

const expirationText = document.getElementById("expirationText");
const renewBtn = document.getElementById("renewBtn");
const renewError = document.getElementById("renewError");

const bioForm = document.getElementById("bioForm");
const bioNom = document.getElementById("bioNom");
const bioDescription = document.getElementById("bioDescription");
const bioDescCount = document.getElementById("bioDescCount");
const bioSaveBtn = document.getElementById("bioSaveBtn");
const bioSaveError = document.getElementById("bioSaveError");
const bioSaveSuccess = document.getElementById("bioSaveSuccess");

function toMillis(timestamp) {
  if (!timestamp) return null;
  return timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
}

function isPanelActive(data) {
  if (!data || data.active !== true) return false;
  const expiresMillis = toMillis(data.expiresAt);
  return expiresMillis !== null && expiresMillis > Date.now();
}

function formatExpirationDate(timestamp) {
  const millis = toMillis(timestamp);
  if (!millis) return "";
  return new Date(millis).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(timestamp) {
  const millis = toMillis(timestamp);
  if (!millis) return Infinity;
  return (millis - Date.now()) / (1000 * 60 * 60 * 24);
}

function updateDescCount() {
  bioDescCount.textContent = 100 - bioDescription.value.length;
}

bioDescription.addEventListener("input", updateDescCount);

// --- Récupère un idToken frais ou redirige vers la connexion ---
async function getAuthHeader() {
  if (!auth.currentUser) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/bio.html");
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/bio.html");
    return null;
  }
}

// --- Crée une session de paiement SasPay pour l'abonnement (activation ou renouvellement) ---
// NOTE : nécessite une route serveur POST /api/payments/create-bio-subscription,
// pas encore créée à ce stade — cet appel échouera (404) tant qu'elle n'existe pas.
async function startBioCheckout(errorEl, button) {
  errorEl.hidden = true;
  const authHeader = await getAuthHeader();
  if (!authHeader) return;

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Redirection...";

  try {
    const res = await fetch("/api/payments/create-bio-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    });

    const data = await res.json();

    if (data.success && data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      errorEl.textContent = data.error || "Impossible de créer le paiement. Réessaie plus tard.";
      errorEl.hidden = false;
      button.disabled = false;
      button.textContent = originalText;
    }
  } catch (error) {
    errorEl.textContent = "Une erreur réseau est survenue. Réessaie plus tard.";
    errorEl.hidden = false;
    button.disabled = false;
    button.textContent = originalText;
  }
}

activateBtn.addEventListener("click", () => startBioCheckout(activateError, activateBtn));
renewBtn.addEventListener("click", () => startBioCheckout(renewError, renewBtn));

// --- Copier le lien public ---
bioCopyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(bioShareLink.value).then(() => {
    bioCopyBtn.textContent = "Copié !";
    setTimeout(() => {
      bioCopyBtn.textContent = "Copier";
    }, 2000);
  });
});

// --- Affichage de l'écran actif, pré-rempli avec les données existantes ---
function showActiveScreen(uid, data) {
  notActiveScreen.hidden = true;
  activeScreen.hidden = false;

  bioShareLink.value = `${window.location.origin}/p.html?u=${uid}`;

  bioNom.value = data.nom || "";
  bioDescription.value = data.description || "";
  updateDescCount();

  const liens = Array.isArray(data.liens) ? data.liens : [];
  for (let i = 0; i < MAX_LINKS; i++) {
    const lien = liens[i] || { titre: "", url: "" };
    document.getElementById(`linkTitle${i + 1}`).value = lien.titre || "";
    document.getElementById(`linkUrl${i + 1}`).value = lien.url || "";
  }

  expirationText.textContent = `Abonnement actif jusqu'au ${formatExpirationDate(data.expiresAt)}`;

  const remainingDays = daysUntil(data.expiresAt);
  renewBtn.hidden = remainingDays > RENEW_THRESHOLD_DAYS;
}

function showNotActiveScreen() {
  activeScreen.hidden = true;
  notActiveScreen.hidden = false;
}

// --- Chargement initial du panel ---
async function loadPanel() {
  const result = await getBioPanel(currentUser.uid);

  loadingState.hidden = true;
  contentState.hidden = false;

  if (!result.success) {
    loadError.textContent = result.error;
    loadError.hidden = false;
    showNotActiveScreen();
    return;
  }

  if (result.exists && isPanelActive(result.data)) {
    showActiveScreen(currentUser.uid, result.data);
  } else {
    showNotActiveScreen();
  }
}

// --- Sauvegarde du formulaire (nom, description, liens) ---
bioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  bioSaveError.hidden = true;
  bioSaveSuccess.hidden = true;

  const liens = [];

  for (let i = 1; i <= MAX_LINKS; i++) {
    const titre = document.getElementById(`linkTitle${i}`).value.trim();
    const url = document.getElementById(`linkUrl${i}`).value.trim();

    if (!titre && !url) {
      continue; // lien vide, on l'ignore
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      bioSaveError.textContent = `Le lien "${titre || i}" doit commencer par http:// ou https://`;
      bioSaveError.hidden = false;
      return;
    }

    liens.push({ titre, url });
  }

  bioSaveBtn.disabled = true;
  bioSaveBtn.textContent = "Enregistrement...";

  const result = await saveBioPanel(currentUser.uid, {
    nom: bioNom.value.trim(),
    description: bioDescription.value.trim(),
    liens,
  });

  bioSaveBtn.disabled = false;
  bioSaveBtn.textContent = "Enregistrer";

  if (result.success) {
    bioSaveSuccess.hidden = false;
    setTimeout(() => {
      bioSaveSuccess.hidden = true;
    }, 2500);
  } else {
    bioSaveError.textContent = result.error;
    bioSaveError.hidden = false;
  }
});

// --- Initialisation ---
onAuthChange((user) => {
  currentUser = user;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/bio.html");
    return;
  }

  loadPanel();
});
