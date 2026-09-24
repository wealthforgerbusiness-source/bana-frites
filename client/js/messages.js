import { onAuthChange } from "./auth.js";
import { getReceivedMessages } from "./firestore.js";

let currentUser = null;
let lastVisible = null;
let hasMore = true;
let currentMessageId = null;

const loadingState = document.getElementById("loadingState");
const contentState = document.getElementById("contentState");
const shareLinkInput = document.getElementById("shareLinkInput");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const errorMsg = document.getElementById("errorMsg");
const messagesLoading = document.getElementById("messagesLoading");
const emptyState = document.getElementById("emptyState");
const messagesList = document.getElementById("messagesList");
const loadMoreBtn = document.getElementById("loadMoreBtn");

const unlockOverlay = document.getElementById("unlockOverlay");
const unlockCard = document.getElementById("unlockCard");
const unlockCloseBtn = document.getElementById("unlockCloseBtn");
const unlockCancelBtn = document.getElementById("unlockCancelBtn");
const unlockPayBtn = document.getElementById("unlockPayBtn");
const unlockPhone = document.getElementById("unlockPhone");
const unlockError = document.getElementById("unlockError");

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.hidden = true;
}

function renderMessages(messages, append) {
  if (!append) {
    while (messagesList.firstChild) {
      messagesList.removeChild(messagesList.firstChild);
    }
  }

  messages.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "message-card";

    const textEl = document.createElement("p");
    textEl.className = "message-text";
    textEl.textContent = msg.text; // jamais innerHTML : le texte vient d'un utilisateur anonyme

    const footer = document.createElement("div");
    footer.className = "message-footer";

    const dateEl = document.createElement("span");
    dateEl.className = "message-date";
    dateEl.textContent = formatDate(msg.createdAt);

    const revealBtn = document.createElement("button");
    revealBtn.className = "reveal-btn";
    revealBtn.textContent = "Révéler l'identité 🔒 ";

    const badge = document.createElement("span");
    badge.className = "reveal-badge";
    badge.textContent = "1$";
    revealBtn.appendChild(badge);

    revealBtn.addEventListener("click", () => openUnlockModal(msg.id));

    footer.appendChild(dateEl);
    footer.appendChild(revealBtn);

    card.appendChild(textEl);
    card.appendChild(footer);

    messagesList.appendChild(card);
  });
}

async function loadInitialMessages() {
  messagesLoading.hidden = false;
  emptyState.hidden = true;
  clearError();

  const result = await getReceivedMessages(currentUser.uid);

  messagesLoading.hidden = true;

  if (result.success) {
    lastVisible = result.lastVisible;
    hasMore = result.messages.length === 10;

    if (result.messages.length === 0) {
      emptyState.hidden = false;
    } else {
      renderMessages(result.messages, false);
    }

    loadMoreBtn.hidden = !hasMore;
  } else {
    showError(result.error);
  }
}

async function loadMoreMessages() {
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Chargement...";
  clearError();

  const result = await getReceivedMessages(currentUser.uid, lastVisible);

  if (result.success) {
    lastVisible = result.lastVisible;
    hasMore = result.messages.length === 10;
    renderMessages(result.messages, true);
    loadMoreBtn.hidden = !hasMore;
  } else {
    showError(result.error);
  }

  loadMoreBtn.disabled = false;
  loadMoreBtn.textContent = "Voir plus";
}

copyLinkBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
    copyLinkBtn.textContent = "Copié !";
    setTimeout(() => {
      copyLinkBtn.textContent = "Copier le lien";
    }, 2000);
  });
});

loadMoreBtn.addEventListener("click", loadMoreMessages);

function openUnlockModal(messageId) {
  currentMessageId = messageId;
  unlockPhone.value = "";
  unlockError.hidden = true;
  unlockPayBtn.disabled = false;
  unlockPayBtn.textContent = "Payer avec Mobile Money";
  unlockOverlay.hidden = false;
}

function closeUnlockModal() {
  unlockOverlay.hidden = true;
  currentMessageId = null;
}

unlockCloseBtn.addEventListener("click", closeUnlockModal);
unlockCancelBtn.addEventListener("click", closeUnlockModal);
unlockOverlay.addEventListener("click", (e) => {
  if (e.target === unlockOverlay) closeUnlockModal();
});
unlockCard.addEventListener("click", (e) => e.stopPropagation());

function isValidPhone(value) {
  return /^\d{9,}$/.test(value);
}

unlockPayBtn.addEventListener("click", async () => {
  unlockError.hidden = true;

  const phone = unlockPhone.value.trim();

  if (!isValidPhone(phone)) {
    unlockError.textContent = "Veuillez entrer un numéro valide (au moins 9 chiffres).";
    unlockError.hidden = false;
    return;
  }

  unlockPayBtn.disabled = true;
  unlockPayBtn.textContent = "Traitement en cours...";

  try {
    const res = await fetch("/api/payments/create-unlock-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: currentMessageId,
        buyerUid: currentUser.uid,
        phone,
      }),
    });

    const data = await res.json();

    if (data.success && data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      unlockError.textContent = data.error || "Impossible de créer le paiement. Veuillez réessayer.";
      unlockError.hidden = false;
      unlockPayBtn.disabled = false;
      unlockPayBtn.textContent = "Payer avec Mobile Money";
    }
  } catch (err) {
    unlockError.textContent = "Une erreur réseau est survenue. Veuillez réessayer.";
    unlockError.hidden = false;
    unlockPayBtn.disabled = false;
    unlockPayBtn.textContent = "Payer avec Mobile Money";
  }
});

onAuthChange((user) => {
  currentUser = user;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/messages.html");
    return;
  }

  loadingState.hidden = true;
  contentState.hidden = false;

  shareLinkInput.value = `${window.location.origin}/message.html?to=${user.uid}`;

  loadInitialMessages();
});
