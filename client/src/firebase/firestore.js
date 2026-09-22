import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
