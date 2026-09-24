import { onAuthChange } from "./auth.js";
import { auth, db } from "./firebase-config.js";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let currentUser = null;
let currentMatchId = null;
let statusPollInterval = null;
let unsubscribeMessages = null;
let unsubscribeMatchDoc = null;

// --- Éléments DOM ---
const loadingState = document.getElementById("loadingState");
const searchScreen = document.getElementById("searchScreen");
const waitingScreen = document.getElementById("waitingScreen");
const chatScreen = document.getElementById("chatScreen");
const decisionScreen = document.getElementById("decisionScreen");
const resultScreen = document.getElementById("resultScreen");

const findMatchBtn = document.getElementById("findMatchBtn");
const cancelWaitBtn = document.getElementById("cancelWaitBtn");

const chatMessages = document.getElementById("chatMessages");
const messagesRemaining = document.getElementById("messagesRemaining");
const readyBtn = document.getElementById("readyBtn");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const decisionStatusText = document.getElementById("decisionStatusText");
const decisionYesBtn = document.getElementById("decisionYesBtn");
const decisionNoBtn = document.getElementById("decisionNoBtn");

const resultSuccess = document.getElementById("resultSuccess");
const resultEnded = document.getElementById("resultEnded");
const backToSearchBtn = document.getElementById("backToSearchBtn");

const ALL_SCREENS = [searchScreen, waitingScreen, chatScreen, decisionScreen, resultScreen];

function showScreen(screen) {
  ALL_SCREENS.forEach((s) => {
    s.hidden = s !== screen;
  });
}

// --- Authentification : récupère le token ou redirige ---
async function getAuthHeader() {
  if (!auth.currentUser) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/matching.html");
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/matching.html");
    return null;
  }
}

async function callMatchingApi(path, options = {}) {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const res = await fetch(`/api/matching/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    },
  });

  return res.json();
}

// --- Nettoyage des écouteurs / polling ---
function stopPolling() {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
}

function stopMatchListeners() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  if (unsubscribeMatchDoc) {
    unsubscribeMatchDoc();
    unsubscribeMatchDoc = null;
  }
}

function resetToSearch() {
  stopPolling();
  stopMatchListeners();
  currentMatchId = null;
  showScreen(searchScreen);
}

// --- Écran recherche ---
findMatchBtn.addEventListener("click", async () => {
  showScreen(waitingScreen);

  const result = await callMatchingApi("join-queue", { method: "POST" });
  if (!result) return;

  if (result.error) {
    alert(result.error);
    resetToSearch();
    return;
  }

  if (result.alreadyMatched || result.matched) {
    enterMatch(result.matchId);
    return;
  }

  if (result.waiting) {
    startStatusPolling();
  }
});

// --- Écran attente : polling du statut ---
function startStatusPolling() {
  stopPolling();
  statusPollInterval = setInterval(async () => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;

    const res = await fetch(`/api/matching/status/${currentUser.uid}`, {
      headers: authHeader,
    });
    const result = await res.json();

    if (result.matched) {
      stopPolling();
      enterMatch(result.matchId);
    }
  }, 3000);
}

cancelWaitBtn.addEventListener("click", async () => {
  stopPolling();
  await callMatchingApi("leave-queue", { method: "POST" });
  showScreen(searchScreen);
});

// --- Entrée dans un match : met en place les écouteurs Firestore ---
function enterMatch(matchId) {
  stopPolling();
  currentMatchId = matchId;

  // Écouteur temps réel sur les messages du match (lecture seule côté client)
  const messagesQuery = query(
    collection(db, "matches", matchId, "messages"),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    while (chatMessages.firstChild) {
      chatMessages.removeChild(chatMessages.firstChild);
    }

    let ownCount = 0;

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const isOwn = msg.senderUid === currentUser.uid;
      if (isOwn) ownCount++;

      const bubble = document.createElement("div");
      bubble.className = isOwn ? "chat-bubble chat-bubble-own" : "chat-bubble chat-bubble-other";

      const textEl = document.createElement("p");
      textEl.textContent = msg.text; // jamais innerHTML : texte écrit par un utilisateur
      bubble.appendChild(textEl);

      chatMessages.appendChild(bubble);
    });

    messagesRemaining.textContent = Math.max(0, 3 - ownCount);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Écouteur temps réel sur le document du match (status, readyForDecision, decisions)
  unsubscribeMatchDoc = onSnapshot(doc(db, "matches", matchId), (docSnap) => {
    if (!docSnap.exists()) return;

    const data = docSnap.data();

    readyBtn.hidden = !data.readyForDecision;

    if (data.status === "matched_confirmed") {
      showResult(true);
    } else if (data.status === "ended") {
      showResult(false);
    } else if (data.status === "active") {
      // Si on est sur l'écran décision et que l'autre n'a pas encore répondu
      if (!decisionScreen.hidden) {
        decisionStatusText.textContent = "En attente de l'autre personne...";
      }
    }
  });

  showScreen(chatScreen);
}

// --- Envoi de message ---
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  chatSendBtn.disabled = true;

  const result = await callMatchingApi("send-message", {
    method: "POST",
    body: JSON.stringify({ matchId: currentMatchId, text }),
  });

  chatSendBtn.disabled = false;

  if (!result) return;

  if (result.error) {
    alert(result.error);
    return;
  }

  chatInput.value = "";
});

// --- Bouton "Ça matche ?" ---
readyBtn.addEventListener("click", () => {
  decisionStatusText.textContent = "";
  showScreen(decisionScreen);
});

// --- Écran décision ---
async function sendDecision(decision) {
  decisionYesBtn.disabled = true;
  decisionNoBtn.disabled = true;

  const result = await callMatchingApi("decision", {
    method: "POST",
    body: JSON.stringify({ matchId: currentMatchId, decision }),
  });

  decisionYesBtn.disabled = false;
  decisionNoBtn.disabled = false;

  if (!result) return;

  if (result.error) {
    alert(result.error);
    return;
  }

  if (result.bothConfirmed) {
    showResult(true);
  } else if (result.ended) {
    showResult(false);
  } else if (result.waitingForOther) {
    decisionStatusText.textContent = "En attente de l'autre personne...";
    // La transition se fera automatiquement via l'écouteur temps réel
    // du document match (unsubscribeMatchDoc) dès que l'autre aura répondu.
  }
}

decisionYesBtn.addEventListener("click", () => sendDecision("oui"));
decisionNoBtn.addEventListener("click", () => sendDecision("non"));

// --- Écran résultat ---
function showResult(isSuccess) {
  resultSuccess.hidden = !isSuccess;
  resultEnded.hidden = isSuccess;
  showScreen(resultScreen);
}

backToSearchBtn.addEventListener("click", () => {
  stopMatchListeners();
  currentMatchId = null;
  showScreen(searchScreen);
});

// --- Initialisation ---
onAuthChange((user) => {
  currentUser = user;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/matching.html");
    return;
  }

  loadingState.hidden = true;
  showScreen(searchScreen);
});
