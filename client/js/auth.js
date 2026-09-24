import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

function getErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Cet email est déjà utilisé par un autre compte.";
    case "auth/invalid-email":
      return "L'adresse email n'est pas valide.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/missing-password":
      return "Veuillez entrer un mot de passe.";
    case "auth/user-not-found":
      return "Aucun compte n'est associé à cet email.";
    case "auth/wrong-password":
      return "Mot de passe incorrect.";
    case "auth/invalid-credential":
      return "Email ou mot de passe incorrect.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Veuillez réessayer plus tard.";
    case "auth/popup-closed-by-user":
      return "La fenêtre de connexion a été fermée avant la fin.";
    case "auth/network-request-failed":
      return "Problème de connexion réseau. Veuillez réessayer.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
}

export async function signUpWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true, user: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
