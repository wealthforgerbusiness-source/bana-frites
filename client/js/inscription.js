import { signUpWithEmail } from "./auth.js";
import { createUserProfile } from "./firestore.js";

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

const form = document.getElementById("signupForm");
const nomInput = document.getElementById("nom");
const postnomInput = document.getElementById("postnom");
const prenomInput = document.getElementById("prenom");
const sexeInput = document.getElementById("sexe");
const dateNaissanceInput = document.getElementById("dateNaissance");
const ageDisplay = document.getElementById("ageDisplay");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const acceptedTermsInput = document.getElementById("acceptedTerms");
const submitBtn = document.getElementById("submitBtn");
const globalError = document.getElementById("globalError");

const errorFields = {
  nom: document.getElementById("errorNom"),
  postnom: document.getElementById("errorPostnom"),
  prenom: document.getElementById("errorPrenom"),
  sexe: document.getElementById("errorSexe"),
  dateNaissance: document.getElementById("errorDateNaissance"),
  email: document.getElementById("errorEmail"),
  password: document.getElementById("errorPassword"),
  confirmPassword: document.getElementById("errorConfirmPassword"),
};

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

dateNaissanceInput.addEventListener("change", () => {
  const value = dateNaissanceInput.value;
  if (value) {
    const age = calculateAge(value);
    ageDisplay.textContent = `Tu as ${age} ans`;
    ageDisplay.hidden = false;
  } else {
    ageDisplay.hidden = true;
  }
});

function updateSubmitState() {
  submitBtn.disabled = !acceptedTermsInput.checked;
}

acceptedTermsInput.addEventListener("change", updateSubmitState);
updateSubmitState();

function validate() {
  clearFieldErrors();
  let isValid = true;

  if (!nomInput.value.trim()) {
    showFieldError("nom", "Le nom est obligatoire.");
    isValid = false;
  }
  if (!postnomInput.value.trim()) {
    showFieldError("postnom", "Le postnom est obligatoire.");
    isValid = false;
  }
  if (!prenomInput.value.trim()) {
    showFieldError("prenom", "Le prénom est obligatoire.");
    isValid = false;
  }

  if (!sexeInput.value) {
    showFieldError("sexe", "Le sexe est obligatoire.");
    isValid = false;
  } else if (sexeInput.value !== "garcon" && sexeInput.value !== "fille") {
    showFieldError("sexe", "Valeur invalide.");
    isValid = false;
  }

  if (!dateNaissanceInput.value) {
    showFieldError("dateNaissance", "La date de naissance est obligatoire.");
    isValid = false;
  } else {
    const age = calculateAge(dateNaissanceInput.value);
    if (age < 18) {
      showFieldError("dateNaissance", "Tu dois avoir au moins 18 ans pour t'inscrire");
      isValid = false;
    }
  }

  if (!emailInput.value.trim()) {
    showFieldError("email", "L'email est obligatoire.");
    isValid = false;
  }

  if (!passwordInput.value) {
    showFieldError("password", "Le mot de passe est obligatoire.");
    isValid = false;
  } else if (passwordInput.value.length < 6) {
    showFieldError("password", "Le mot de passe doit contenir au moins 6 caractères.");
    isValid = false;
  }

  if (!confirmPasswordInput.value) {
    showFieldError("confirmPassword", "La confirmation du mot de passe est obligatoire.");
    isValid = false;
  } else if (passwordInput.value !== confirmPasswordInput.value) {
    showFieldError("confirmPassword", "Les mots de passe ne correspondent pas.");
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

  if (!acceptedTermsInput.checked) {
    showGlobalError("Tu dois accepter les conditions pour continuer");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Création en cours...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const result = await signUpWithEmail(email, password);

  if (result.success) {
    const age = calculateAge(dateNaissanceInput.value);
    const profileResult = await createUserProfile(result.user.uid, {
      nom: nomInput.value.trim(),
      postnom: postnomInput.value.trim(),
      prenom: prenomInput.value.trim(),
      sexe: sexeInput.value,
      dateNaissance: dateNaissanceInput.value,
      age,
      email,
    });

    if (profileResult.success) {
      window.location.href = "/index.html";
    } else {
      showGlobalError(
        "Ton compte a été créé, mais une erreur est survenue lors de l'enregistrement de ton profil. " + profileResult.error
      );
      submitBtn.disabled = false;
      submitBtn.textContent = "Créer un compte";
    }
  } else {
    showGlobalError(result.error);
    submitBtn.disabled = false;
    submitBtn.textContent = "Créer un compte";
  }
});
