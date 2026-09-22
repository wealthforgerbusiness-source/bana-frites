import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config.js";

export async function createUserProfile(uid, data) {
  try {
    const { nom, postnom, prenom, dateNaissance, age, email } = data;

    await setDoc(doc(db, "users", uid), {
      nom,
      postnom,
      prenom,
      dateNaissance,
      age,
      email,
      createdAt: serverTimestamp(),
      description: "",
      photoURL: null,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Une erreur est survenue lors de la création du profil. Veuillez réessayer." };
  }
}

export async function sendAnonymousMessage(toUid, text) {
  try {
    await addDoc(collection(db, "messages"), {
      toUid,
      text,
      createdAt: serverTimestamp(),
      revealed: false,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Impossible d'envoyer le message. Veuillez réessayer." };
  }
}
