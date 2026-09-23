import {
  doc,
  setDoc,
  collection,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
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

export async function sendAnonymousMessage(toUid, text, fromUid) {
  try {
    const messageRef = doc(collection(db, "messages"));

    const batch = writeBatch(db);

    batch.set(messageRef, {
      toUid,
      text,
      createdAt: serverTimestamp(),
      revealed: false,
    });

    batch.set(doc(db, "messageSenders", messageRef.id), {
      fromUid,
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    return { success: false, error: "Impossible d'envoyer le message. Veuillez réessayer." };
  }
}

export async function getReceivedMessages(uid, lastVisible = null) {
  try {
    let q;

    if (lastVisible) {
      q = query(
        collection(db, "messages"),
        where("toUid", "==", uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(10)
      );
    } else {
      q = query(
        collection(db, "messages"),
        where("toUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
    }

    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const newLastVisible = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { success: true, messages, lastVisible: newLastVisible };
  } catch (error) {
    return { success: false, error: "Impossible de charger les messages. Veuillez réessayer." };
  }
}
