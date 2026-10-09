import { onAuthChange, signOutUser } from "./auth.js";
import {
  getUserProfile,
  updateUserDescription,
  createUserProfile,
  userProfileExists,
  markProfileOk,
} from "./firestore.js";

const MAX_LENGTH = 200;
const MIN_AGE = 18;

const loadingState = document.getElementById("loadingState");
const contentState = document.getElementById("contentState");
const setupState = document.getElementById("setupState");
const fetchError = document.getElementById("fetchError");
const profileContent = document.getElementById("profileContent");

const avatarBlock = document.getElementById("avatarBlock");
const nomValue = document.getElementById("nomValue");
const prenomValue = document.getElementById("prenomValue");

const descriptionInput = document.getElementById("description");
const charCount = document.getElementById("charCount");
const saveBtn = document.getElementById("saveBtn");
const saveError = document.getElementById("saveError");
const saveSuccess = document.getElementById("saveSuccess");

// Écran "Complète ton profil" (comptes sans profil, ex: connexion Google)
const setupForm = document.getElementById("setupForm");
const setupEmail = document.getElementById("setupEmail");
const setupGlobalError = document.getElementById("setupGlobalError");
const setupPrenom = document.getElementById("setupPrenom");
const setupNom = document.getElementById("setupNom");
const setupPostnom = document.getElementById("setupPostnom");
const setupSexe = document.getElementById("setupSexe");
const setupDob = document.getElementById("setupDob");
const setupAge = document.getElementById("setupAge");
const setupTel = document.getElementById("setupTel");
const setupTerms = document.getElementById("setupTerms");
const setupSubmit = document.getElementById("setupSubmit");
const setupLogoutBtn = document.getElementById("setupLogoutBtn");

const setupErrors = {
  prenom: document.getElementById("setupErrPrenom"),
  nom: document.getElementById("setupErrNom"),
  postnom: document.getElementById("setupErrPostnom"),
  sexe: document.getElementById("setupErrSexe"),
  dob: document.getElementById("setupErrDob"),
  tel: document.getElementById("setupErrTel"),
};

let currentUser = null;
let successTimeout = null;

function calculateAge(dateNaissance) {
  const birthDate = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Chemin local uniquement : jamais d'URL externe ni "//site.com"
function getRedirectUrl() {
  const redirect = new URLSearchParams(window.location.search).get("redirect");

  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.startsWith("/\\")) {
    return redirect;
  }

  return "/index.html";
}

/* ------------------------------------------------------------------ */
/* Affichage du profil                                                 */
/* ------------------------------------------------------------------ */

function renderAvatar(user, prenom) {
  // Vide le bloc sans innerHTML
  while (avatarBlock.firstChild) {
    avatarBlock.removeChild(avatarBlock.firstChild);
  }

  if (user.photoURL) {
    const img = document.createElement("img");
    img.src = user.photoURL;
    img.alt = "Photo de profil";
    img.className = "profile-avatar-img";
    avatarBlock.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "profile-avatar-placeholder";
    placeholder.textContent = prenom ? prenom.charAt(0).toUpperCase() : "?";

    const hint = document.createElement("p");
    hint.className = "profile-avatar-hint";
    hint.textContent = "Connecte-toi avec Google pour avoir une photo automatique";

    avatarBlock.appendChild(placeholder);
    avatarBlock.appendChild(hint);
  }
}

function updateCharCount() {
  const remaining = MAX_LENGTH - descriptionInput.value.length;
  charCount.textContent = remaining;
}

descriptionInput.addEventListener("input", updateCharCount);

async function loadProfile() {
  const result = await getUserProfile(currentUser.uid);

  loadingState.hidden = true;

  if (result.success) {
    contentState.hidden = false;
    profileContent.hidden = false;

    nomValue.textContent = result.data.nom || "";
    prenomValue.textContent = result.data.prenom || "";
    descriptionInput.value = result.data.description || "";
    updateCharCount();

    renderAvatar(currentUser, result.data.prenom);
  } else {
    contentState.hidden = false;
    fetchError.textContent = result.error;
    fetchError.hidden = false;
  }
}

saveBtn.addEventListener("click", async () => {
  saveError.hidden = true;
  saveSuccess.hidden = true;
  if (successTimeout) clearTimeout(successTimeout);

  saveBtn.disabled = true;
  saveBtn.textContent = "Enregistrement...";

  const result = await updateUserDescription(currentUser.uid, descriptionInput.value);

  saveBtn.disabled = false;
  saveBtn.textContent = "Enregistrer";

  if (result.success) {
    saveSuccess.hidden = false;
    successTimeout = setTimeout(() => {
      saveSuccess.hidden = true;
    }, 2500);
  } else {
    saveError.textContent = result.error;
    saveError.hidden = false;
  }
});

/* ------------------------------------------------------------------ */
/* Écran "Complète ton profil"                                         */
/* ------------------------------------------------------------------ */

function showSetupError(field, message) {
  setupErrors[field].textContent = message;
  setupErrors[field].hidden = false;
}

function clearSetupErrors() {
  Object.values(setupErrors).forEach((el) => {
    el.textContent = "";
    el.hidden = true;
  });
}

function showSetupGlobalError(message) {
  setupGlobalError.textContent = message;
  setupGlobalError.hidden = false;
}

function clearSetupGlobalError() {
  setupGlobalError.textContent = "";
  setupGlobalError.hidden = true;
}

function updateSetupSubmitState() {
  setupSubmit.disabled = !setupTerms.checked;
}

function showSetup(user) {
  setupEmail.textContent = user.email || "(aucun email)";

  // Pré-remplissage depuis le nom Google ("Prénom Nom"), modifiable par l'utilisateur
  const parts = (user.displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    setupPrenom.value = parts[0];
    setupNom.value = parts.slice(1).join(" ");
  }

  // Interdit une date de naissance dans le futur dans le sélecteur
  setupDob.max = new Date().toISOString().split("T")[0];

  loadingState.hidden = true;
  contentState.hidden = true;
  setupState.hidden = false;
}

setupDob.addEventListener("change", () => {
  if (setupDob.value) {
    setupAge.textContent = `Tu as ${calculateAge(setupDob.value)} ans`;
    setupAge.hidden = false;
  } else {
    setupAge.hidden = true;
  }
});

setupTerms.addEventListener("change", updateSetupSubmitState);
updateSetupSubmitState();

function validateSetup() {
  clearSetupErrors();
  let isValid = true;

  if (!setupPrenom.value.trim()) {
    showSetupError("prenom", "Le prénom est obligatoire.");
    isValid = false;
  }
  if (!setupNom.value.trim()) {
    showSetupError("nom", "Le nom est obligatoire.");
    isValid = false;
  }
  if (!setupPostnom.value.trim()) {
    showSetupError("postnom", "Le postnom est obligatoire.");
    isValid = false;
  }

  if (setupSexe.value !== "garcon" && setupSexe.value !== "fille") {
    showSetupError("sexe", "Le sexe est obligatoire.");
    isValid = false;
  }

  if (!setupDob.value) {
    showSetupError("dob", "La date de naissance est obligatoire.");
    isValid = false;
  } else {
    const age = calculateAge(setupDob.value);
    if (Number.isNaN(age) || age < MIN_AGE) {
      showSetupError("dob", `Tu dois avoir au moins ${MIN_AGE} ans pour utiliser Bana Frites.`);
      isValid = false;
    } else if (age > 120) {
      showSetupError("dob", "Date de naissance invalide.");
      isValid = false;
    }
  }

  if (!setupTel.value.trim()) {
    showSetupError("tel", "Le numéro de téléphone est obligatoire.");
    isValid = false;
  } else if (!/^\d{9,15}$/.test(setupTel.value.trim())) {
    showSetupError("tel", "Numéro invalide (9 à 15 chiffres, sans espace ni +).");
    isValid = false;
  }

  return isValid;
}

setupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearSetupGlobalError();

  if (!currentUser) return;
  if (!validateSetup()) return;

  if (!setupTerms.checked) {
    showSetupGlobalError("Tu dois accepter les conditions pour continuer.");
    return;
  }

  if (!currentUser.email) {
    showSetupGlobalError("Ton compte n'a pas d'adresse email. Déconnecte-toi et utilise un autre compte.");
    return;
  }

  setupSubmit.disabled = true;
  setupSubmit.textContent = "Enregistrement...";

  const result = await createUserProfile(currentUser.uid, {
    nom: setupNom.value.trim(),
    postnom: setupPostnom.value.trim(),
    prenom: setupPrenom.value.trim(),
    sexe: setupSexe.value,
    dateNaissance: setupDob.value,
    age: calculateAge(setupDob.value),
    email: currentUser.email,
    telephone: setupTel.value.trim(),
  });

  if (result.success) {
    markProfileOk(currentUser.uid);
    window.location.href = getRedirectUrl();
  } else {
    showSetupGlobalError(result.error);
    setupSubmit.disabled = false;
    setupSubmit.textContent = "Valider mon profil";
    updateSetupSubmitState();
  }
});

setupLogoutBtn.addEventListener("click", async () => {
  await signOutUser();
  window.location.href = "/index.html";
});

/* ------------------------------------------------------------------ */
/* Démarrage                                                           */
/* ------------------------------------------------------------------ */

let started = false;

onAuthChange(async (user) => {
  currentUser = user;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/profil.html");
    return;
  }

  // Une seule initialisation (onAuthChange peut se redéclencher, ex: renouvellement du jeton)
  if (started) return;
  started = true;

  // Compte sans profil (ex: connexion Google) : écran "Complète ton profil"
  const check = await userProfileExists(user.uid);
  if (check.success && !check.exists) {
    showSetup(user);
    return;
  }

  markProfileOk(user.uid);
  loadProfile();
});
