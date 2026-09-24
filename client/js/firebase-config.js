import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TODO_REMPLACER_PAR_TA_VRAIE_API_KEY",
  authDomain: "TODO_REMPLACER.firebaseapp.com",
  projectId: "TODO_REMPLACER",
  storageBucket: "TODO_REMPLACER.appspot.com",
  messagingSenderId: "TODO_REMPLACER",
  appId: "TODO_REMPLACER",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
