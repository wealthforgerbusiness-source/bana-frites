import { onAuthChange } from "./auth.js";
import { getUserProfile, updateUserDescription } from "./firestore.js";

const MAX_LENGTH = 200;

const loadingState = document.getElementById("loadingState");
const contentState = document.getElementById("contentState");
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

let currentUser = null;
let successTimeout = null;

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

onAuthChange((user) => {
  currentUser = user;

  if (!user) {
    window.location.href = "/connexion.html?redirect=" + encodeURIComponent("/profil.html");
    return;
  }

  loadProfile();
});
