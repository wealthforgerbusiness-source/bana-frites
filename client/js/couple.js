import { onAuthChange } from "./auth.js";
import { createCoupleQuiz, getCoupleQuiz, submitCoupleAnswers } from "./firestore.js";

// 5 questions fixes à choix multiples
const QUESTIONS = [
  { text: "Quelle boisson tu préfères ?", options: ["Coca", "Fanta", "Vody", "Eau"] },
  { text: "Quel jour tu préfères pour sortir ?", options: ["Vendredi", "Samedi", "Dimanche", "N'importe"] },
  { text: "Quelle activité tu préfères en couple ?", options: ["Cinéma", "Resto", "Balade", "Jeux vidéo"] },
  { text: "Quel style de musique tu préfères ?", options: ["Afrobeat", "Ndombolo", "Rap", "Gospel"] },
  { text: "Combien d'enfants tu veux avoir ?", options: ["0", "1-2", "3-4", "5+"] },
];

let currentUser = null;
let quizIdFromUrl = null;
let loadedQuiz = null;

// --- Éléments DOM ---
const loadingState = document.getElementById("loadingState");
const quizIntro = document.getElementById("quizIntro");
const quizCreate = document.getElementById("quizCreate");
const quizShare = document.getElementById("quizShare");
const quizAnswer = document.getElementById("quizAnswer");
const quizResult = document.getElementById("quizResult");

const ALL_SCREENS = [quizIntro, quizCreate, quizShare, quizAnswer, quizResult];

const startQuizBtn = document.getElementById("startQuizBtn");

const createProgress = document.getElementById("createProgress");
const createQuestionContainer = document.getElementById("createQuestionContainer");
const createPrevBtn = document.getElementById("createPrevBtn");
const createNextBtn = document.getElementById("createNextBtn");

const shareLinkInput = document.getElementById("shareLinkInput");
const copyShareLinkBtn = document.getElementById("copyShareLinkBtn");
const whatsappShareBtn = document.getElementById("whatsappShareBtn");

const answerProgress = document.getElementById("answerProgress");
const answerQuestionContainer = document.getElementById("answerQuestionContainer");
const answerPrevBtn = document.getElementById("answerPrevBtn");
const answerNextBtn = document.getElementById("answerNextBtn");

const resultTitle = document.getElementById("resultTitle");
const resultPercent = document.getElementById("resultPercent");
const resultScoreBlock = document.getElementById("resultScoreBlock");
const resultLockedBlock = document.getElementById("resultLockedBlock");
const resultHeartsAnim = document.getElementById("resultHeartsAnim");

function showScreen(screen) {
  ALL_SCREENS.forEach((s) => {
    s.hidden = s !== screen;
  });
}

// --- Rendu d'une question (réutilisé pour l'écran création et l'écran réponse) ---
// SÉCURITÉ : uniquement textContent, jamais innerHTML, même si les questions sont fixes.
function renderQuestion(container, progressEl, index, selectedAnswers, onSelect) {
  const question = QUESTIONS[index];

  progressEl.textContent = `Question ${index + 1}/${QUESTIONS.length}`;

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const titleEl = document.createElement("p");
  titleEl.className = "couple-question-text";
  titleEl.textContent = question.text;
  container.appendChild(titleEl);

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "couple-options";

  question.options.forEach((optionText, optionIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "couple-option-btn";
    btn.textContent = optionText;

    if (selectedAnswers[index] === optionIndex) {
      btn.classList.add("couple-option-selected");
    }

    btn.addEventListener("click", () => {
      onSelect(index, optionIndex);
    });

    optionsWrap.appendChild(btn);
  });

  container.appendChild(optionsWrap);
}

function buildShareUrl(quizId) {
  return `${window.location.origin}/couple.html?quiz=${quizId}`;
}

function fillShareScreen(quizId) {
  const shareUrl = buildShareUrl(quizId);
  shareLinkInput.value = shareUrl;

  const whatsappText = `On fait le Jeu Couple sur Bana Frites ? 💕 Réponds à ce quiz : ${shareUrl}`;
  whatsappShareBtn.href = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
}

// ============================
// --- Écran 2 : création du quiz ---
// ============================
let createIndex = 0;
const createAnswers = new Array(QUESTIONS.length).fill(null);

function updateCreateNav() {
  createPrevBtn.hidden = createIndex === 0;
  createNextBtn.disabled = createAnswers[createIndex] === null;
  createNextBtn.textContent = createIndex === QUESTIONS.length - 1 ? "Valider" : "Suivant";
}

function renderCreateQuestion() {
  renderQuestion(createQuestionContainer, createProgress, createIndex, createAnswers, (index, optionIndex) => {
    createAnswers[index] = optionIndex;
    renderCreateQuestion();
  });
  updateCreateNav();
}

startQuizBtn.addEventListener("click", () => {
  createIndex = 0;
  createAnswers.fill(null);
  renderCreateQuestion();
  showScreen(quizCreate);
});

createPrevBtn.addEventListener("click", () => {
  if (createIndex > 0) {
    createIndex--;
    renderCreateQuestion();
  }
});

createNextBtn.addEventListener("click", async () => {
  if (createAnswers[createIndex] === null) return;

  if (createIndex < QUESTIONS.length - 1) {
    createIndex++;
    renderCreateQuestion();
    return;
  }

  createNextBtn.disabled = true;
  createNextBtn.textContent = "Création...";

  const result = await createCoupleQuiz(currentUser.uid, createAnswers);

  if (!result.success) {
    alert(result.error);
    createNextBtn.disabled = false;
    createNextBtn.textContent = "Valider";
    return;
  }

  fillShareScreen(result.quizId);
  showScreen(quizShare);
});

copyShareLinkBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    copyShareLinkBtn.textContent = "Copié !";
    setTimeout(() => {
      copyShareLinkBtn.textContent = "Copier";
    }, 2000);
  } catch (error) {
    shareLinkInput.select();
  }
});

// ============================
// --- Écran 4 : réponse à un quiz reçu ---
// ============================
let answerIndex = 0;
const answerAnswers = new Array(QUESTIONS.length).fill(null);

function updateAnswerNav() {
  answerPrevBtn.hidden = answerIndex === 0;
  answerNextBtn.disabled = answerAnswers[answerIndex] === null;
  answerNextBtn.textContent = answerIndex === QUESTIONS.length - 1 ? "Valider" : "Suivant";
}

function renderAnswerQuestion() {
  renderQuestion(answerQuestionContainer, answerProgress, answerIndex, answerAnswers, (index, optionIndex) => {
    answerAnswers[index] = optionIndex;
    renderAnswerQuestion();
  });
  updateAnswerNav();
}

answerPrevBtn.addEventListener("click", () => {
  if (answerIndex > 0) {
    answerIndex--;
    renderAnswerQuestion();
  }
});

answerNextBtn.addEventListener("click", async () => {
  if (answerAnswers[answerIndex] === null) return;

  if (answerIndex < QUESTIONS.length - 1) {
    answerIndex++;
    renderAnswerQuestion();
    return;
  }

  answerNextBtn.disabled = true;
  answerNextBtn.textContent = "Envoi...";

  const result = await submitCoupleAnswers(quizIdFromUrl, answerAnswers, currentUser.uid);

  if (!result.success) {
    alert(result.error);
    answerNextBtn.disabled = false;
    answerNextBtn.textContent = "Valider";
    return;
  }

  showResult(loadedQuiz.answers, answerAnswers);
});

// ============================
// --- Écran 5 : résultat / score de compatibilité ---
// ============================
function computeScore(answersA, answersB) {
  let matches = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    if (answersA[i] === answersB[i]) {
      matches++;
    }
  }

  return Math.round((matches / QUESTIONS.length) * 100);
}

function showResult(answersA, answersB) {
  const score = computeScore(answersA, answersB);
  resultPercent.textContent = String(score);

  resultScoreBlock.hidden = false;
  resultLockedBlock.hidden = true;
  resultHeartsAnim.hidden = false;

  showScreen(quizResult);
}

// Vu par une 3e personne qui ouvre un lien déjà complété : pas de score affiché.
function showLockedResult() {
  resultScoreBlock.hidden = true;
  resultLockedBlock.hidden = false;
  resultHeartsAnim.hidden = true;

  showScreen(quizResult);
}

// ============================
// --- Initialisation ---
// ============================
async function loadQuizFromUrl(quizId) {
  const result = await getCoupleQuiz(quizId);

  if (!result.success) {
    alert(result.error);
    showScreen(quizIntro);
    return;
  }

  loadedQuiz = result.data;

  // Le quiz a déjà les deux séries de réponses.
  if (loadedQuiz.answersB) {
    const isParticipant =
      loadedQuiz.creatorUid === currentUser.uid || loadedQuiz.secondPlayerUid === currentUser.uid;

    if (isParticipant) {
      showResult(loadedQuiz.answers, loadedQuiz.answersB);
    } else {
      // Une 3e personne ouvre le lien après coup : pas de score, juste "déjà complété".
      showLockedResult();
    }
    return;
  }

  // Le créateur qui revient sur son propre lien avant que l'autre personne ait répondu :
  // on lui remontre l'écran de partage plutôt que de lui faire répondre à son propre quiz.
  if (loadedQuiz.creatorUid === currentUser.uid) {
    fillShareScreen(quizId);
    showScreen(quizShare);
    return;
  }

  answerIndex = 0;
  answerAnswers.fill(null);
  renderAnswerQuestion();
  showScreen(quizAnswer);
}

onAuthChange((user) => {
  currentUser = user;

  if (!user) {
    const redirect = "/couple.html" + window.location.search;
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent(redirect);
    return;
  }

  loadingState.hidden = true;

  const params = new URLSearchParams(window.location.search);
  quizIdFromUrl = params.get("quiz");

  if (quizIdFromUrl) {
    loadQuizFromUrl(quizIdFromUrl);
  } else {
    showScreen(quizIntro);
  }
});
