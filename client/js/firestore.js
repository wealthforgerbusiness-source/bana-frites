import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function createUserProfile(uid, data) {
  try {
    const { nom, postnom, prenom, sexe, dateNaissance, age, email, telephone } = data;

    await setDoc(doc(db, "users", uid), {
      nom,
      postnom,
      prenom,
      sexe,
      dateNaissance,
      age,
      email,
      telephone,
      createdAt: serverTimestamp(),
      description: "",
      photoURL: null,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Une erreur est survenue lors de la création du profil. Veuillez réessayer." };
  }
}

export async function getUserProfile(uid) {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));

    if (!docSnap.exists()) {
      return { success: false, error: "Profil introuvable." };
    }

    return { success: true, data: docSnap.data() };
  } catch (error) {
    return { success: false, error: "Impossible de charger le profil. Veuillez réessayer." };
  }
}

export async function updateUserDescription(uid, text) {
  try {
    await updateDoc(doc(db, "users", uid), {
      description: text,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Impossible d'enregistrer la description. Veuillez réessayer." };
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
// --- Jeu Couple ---

export async function createCoupleQuiz(creatorUid, answers) {
  try {
    const quizRef = doc(collection(db, "coupleQuizzes"));

    await setDoc(quizRef, {
      creatorUid,
      answers,
      answersB: null,
      secondPlayerUid: null,
      createdAt: serverTimestamp(),
    });

    return { success: true, quizId: quizRef.id };
  } catch (error) {
    return { success: false, error: "Impossible de créer le quiz. Veuillez réessayer." };
  }
}

export async function getCoupleQuiz(quizId) {
  try {
    const docSnap = await getDoc(doc(db, "coupleQuizzes", quizId));

    if (!docSnap.exists()) {
      return { success: false, error: "Quiz introuvable." };
    }

    return { success: true, data: docSnap.data() };
  } catch (error) {
    return { success: false, error: "Impossible de charger le quiz. Veuillez réessayer." };
  }
}

export async function submitCoupleAnswers(quizId, answersB, secondPlayerUid) {
  try {
    await updateDoc(doc(db, "coupleQuizzes", quizId), {
      answersB,
      secondPlayerUid,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Impossible d'enregistrer tes réponses. Veuillez réessayer." };
  }
}
