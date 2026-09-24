import { onAuthChange } from "./auth.js";
import { sendAnonymousMessage } from "./firestore.js";

const MAX_LENGTH = 300;

const params = new URLSearchParams(window.location.search);
const toUid = params.get("to");

const loadingState = document.getElementById("loadingState");
const loggedOutState = document.getElementById("loggedOutState");
const loggedInState = document.getElementById("loggedInState");
const loginLink = document.getElementById("loginLink");

const messageForm = document.getElementById("messageForm");
const messageText = document.getElementById("messageText");
const charCount = document.getElementById("charCount");
const submitBtn = document.getElementById("submitBtn");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

function showError(message) {
  // textContent uniquement : jamais d'innerHTML avec du texte dynamique
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.hidden = true;
}

function showSuccess() {
  successMsg.hidden = false;
}

function hideSuccess() {
  successMsg.hidden = true;
}

// Garde en mémoire l'URL de retour pour rediriger ici après connexion
if (loginLink) {
  const returnUrl = window.location.pathname + window.location.search;
  sessionStorage.setItem("redirectAfterLogin", returnUrl);
  loginLink.href = `/connexion.html?redirect=${encodeURIComponent(returnUrl)}`;
}

messageText.addEventListener("input", () => {
  const remaining = MAX_LENGTH - messageText.value.length;
  charCount.textContent = remaining;
});

let currentUser = null;

onAuthChange((user) => {
  currentUser = user;
  loadingState.hidden = true;

  if (user) {
    loggedOutState.hidden = true;
    loggedInState.hidden = false;
  } else {
    loggedInState.hidden = true;
    loggedOutState.hidden = false;
  }
});

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  hideSuccess();

  const text = messageText.value.trim();

  if (!text) {
    showError("Le message ne peut pas être vide.");
    return;
  }

  if (!toUid) {
    showError("Lien invalide : destinataire manquant.");
    return;
  }

  if (!currentUser) {
    showError("Tu dois être connecté pour envoyer ce message.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";

  const result = await sendAnonymousMessage(toUid, text, currentUser.uid);

  if (result.success) {
    messageText.value = "";
    charCount.textContent = MAX_LENGTH;
    showSuccess();
  } else {
    showError(result.error);
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Envoyer anonymement";
});
