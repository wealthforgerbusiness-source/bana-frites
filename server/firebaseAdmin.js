import admin from "firebase-admin";

// Où trouver ces credentials :
// Firebase Console → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée
// Cela télécharge un fichier JSON contenant project_id, client_email et private_key,
// à reporter respectivement dans FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL
// et FIREBASE_ADMIN_PRIVATE_KEY (variables d'environnement du serveur).

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

export { db, admin };
