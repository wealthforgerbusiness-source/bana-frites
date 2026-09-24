import admin from "firebase-admin";

// Où trouver ces credentials :
// Firebase Console → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée
// Cela télécharge un fichier JSON contenant project_id, client_email et private_key,
// à reporter respectivement dans FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL
// et FIREBASE_ADMIN_PRIVATE_KEY (variables d'environnement du serveur).

function formatPrivateKey(key) {
  if (!key) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY est manquante dans les variables d'environnement.");
  }

  // Retire d'éventuels guillemets englobants collés par erreur dans Render
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }

  // Convertit les \n littéraux (texte "\n") en vrais retours à la ligne
  return cleaned.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  }),
});

const db = admin.firestore();

export { db, admin };
