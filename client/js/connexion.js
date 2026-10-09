import { signInWithEmail, signInWithGoogle } from "./auth.js";
import { userProfileExists } from "./firestore.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const googleBtn = document.getElementById("googleBtn");
const globalError = document.getElementById("globalError");

const errorFields = {
  email: document.getElementById("errorEmail"),
  password: document.getElementById("errorPassword"),
};

function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  // Sécurité : n'accepte qu'un chemin local (commence par "/"), jamais une URL externe
  // (protection basique contre un ?redirect=https://site-malveillant.com )
  // "//site.com" et "/\\site.com" commencent aussi par "/" mais mènent vers un site externe : refusés
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.startsWith("/\\")) {
    return redirect;
  }

  return "/index.html";
}

// Après connexion : un compte sans profil (ex: Google) passe d'abord par "Complète ton profil"
async function goAfterLogin(user) {
  const target = getRedirectUrl();
  const check = await userProfileExists(user.uid);

  if (check.success && !check.exists) {
    window.location.href = "/profil.html?redirect=" + encodeURIComponent(target);
  } else {
    window.location.href = target;
  }
}

function showFieldError(field, message) {
  errorFields[field].textContent = message;
  errorFields[field].hidden = false;
}

function clearFieldErrors() {
  Object.values(errorFields).forEach((el) => {
    el.textContent = "";
    el.hidden = true;
  });
}

function showGlobalError(message) {
  globalError.textContent = message;
  globalError.hidden = false;
}

function clearGlobalError() {
  globalError.textContent = "";
  globalError.hidden = true;
}

function validate() {
  clearFieldErrors();
  let isValid = true;

  if (!emailInput.value.trim()) {
    showFieldError("email", "L'email est obligatoire.");
    isValid = false;
  }
  if (!passwordInput.value) {
    showFieldError("password", "Le mot de passe est obligatoire.");
    isValid = false;
  }

  return isValid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearGlobalError();

  if (!validate()) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Connexion en cours...";

  const result = await signInWithEmail(emailInput.value.trim(), passwordInput.value);

  if (result.success) {
    await goAfterLogin(result.user);
  } else {
    showGlobalError(result.error);
    submitBtn.disabled = false;
    submitBtn.textContent = "Se connecter";
  }
});

googleBtn.addEventListener("click", async () => {
  clearGlobalError();
  googleBtn.disabled = true;
  googleBtn.textContent = "Connexion en cours...";

  const result = await signInWithGoogle();

  if (result.success) {
    await goAfterLogin(result.user);
  } else {
    showGlobalError(result.error);
    googleBtn.disabled = false;
    googleBtn.textContent = "Se connecter avec Google";
  }
});
