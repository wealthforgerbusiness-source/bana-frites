import { Router } from "express";
import axios from "axios";
import { db, admin } from "../firebaseAdmin.js";

const router = Router();

// Vérifie le token Firebase envoyé par le client et en extrait le VRAI uid.
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentification requise." });
  }

  const idToken = authHeader.slice("Bearer ".length);

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.authUid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée. Reconnecte-toi." });
  }
}

// --- Déblocage de l'identité d'un message anonyme (1$) ---
router.post("/create-unlock-payment", async (req, res) => {
  const { messageId, buyerUid, phone } = req.body;

  if (!messageId || !buyerUid || !phone) {
    return res.status(400).json({ success: false, error: "messageId, buyerUid et phone sont obligatoires." });
  }

  if (!/^\d{9,}$/.test(phone)) {
    return res.status(400).json({ success: false, error: "Numéro invalide" });
  }

  try {
    const messageRef = db.collection("messages").doc(messageId);
    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      return res.status(400).json({ success: false, error: "Message introuvable." });
    }

    const messageData = messageSnap.data();

    if (messageData.toUid !== buyerUid) {
      return res.status(403).json({ success: false, error: "Vous n'êtes pas autorisé à débloquer ce message." });
    }

    if (messageData.revealed === true) {
      return res.status(400).json({ success: false, error: "Déjà débloqué" });
    }

    const userRef = db.collection("users").doc(buyerUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(400).json({ success: false, error: "Profil utilisateur introuvable." });
    }

    const userData = userSnap.data();
    const { email, nom, prenom } = userData;

    const saspayResponse = await axios.post(
      "https://api.saspay.me/api/v1/checkout-sessions/",
      {
        amount: process.env.SASPAY_UNLOCK_AMOUNT,
        currency: process.env.SASPAY_CURRENCY,
        description: `unlock:${messageId}`,
        customer_email: email,
        customer_name: `${prenom} ${nom}`,
        customer_phone: phone,
        return_url: `${process.env.CLIENT_URL}/mes-messages`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SASPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (saspayResponse.status === 201) {
      return res.json({ success: true, paymentUrl: saspayResponse.data.checkout_url });
    }

    console.error("Réponse SasPay inattendue:", saspayResponse.status, saspayResponse.data);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  } catch (error) {
    console.error("Erreur SasPay:", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  }
});

// --- Abonnement panel link-in-bio (2$/mois) ---
router.post("/create-bio-subscription", verifyAuth, async (req, res) => {
  const uid = req.authUid;

  try {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(400).json({ success: false, error: "Profil utilisateur introuvable." });
    }

    const { email, nom, prenom } = userSnap.data();

    const saspayResponse = await axios.post(
      "https://api.saspay.me/api/v1/checkout-sessions/",
      {
        amount: process.env.SASPAY_BIO_SUBSCRIPTION_AMOUNT,
        currency: process.env.SASPAY_CURRENCY,
        description: `bio-subscribe:${uid}`,
        customer_email: email,
        customer_name: `${prenom} ${nom}`,
        return_url: `${process.env.CLIENT_URL}/bio.html`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SASPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (saspayResponse.status === 201) {
      return res.json({ success: true, paymentUrl: saspayResponse.data.checkout_url });
    }

    console.error("Réponse SasPay inattendue:", saspayResponse.status, saspayResponse.data);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  } catch (error) {
    console.error("Erreur SasPay (bio subscription):", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  }
});

// --- Révélation du téléphone après un match confirmé (1$) ---
router.post("/create-phone-unlock-payment", verifyAuth, async (req, res) => {
  const uid = req.authUid;
  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).json({ success: false, error: "matchId est obligatoire." });
  }

  try {
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      return res.status(400).json({ success: false, error: "Match introuvable." });
    }

    const matchData = matchSnap.data();

    let revealedField;
    if (matchData.userA === uid) {
      revealedField = "phoneRevealedA";
    } else if (matchData.userB === uid) {
      revealedField = "phoneRevealedB";
    } else {
      return res.status(403).json({ success: false, error: "Vous ne faites pas partie de ce match." });
    }

    if (matchData.status !== "matched_confirmed") {
      return res.status(400).json({ success: false, error: "Ce match n'est pas encore confirmé." });
    }

    if (matchData[revealedField] === true) {
      return res.status(400).json({ success: false, error: "Déjà débloqué" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(400).json({ success: false, error: "Profil utilisateur introuvable." });
    }

    const { email, nom, prenom } = userSnap.data();

    const saspayResponse = await axios.post(
      "https://api.saspay.me/api/v1/checkout-sessions/",
      {
        amount: process.env.SASPAY_UNLOCK_AMOUNT,
        currency: process.env.SASPAY_CURRENCY,
        description: `unlock-phone:${matchId}:${uid}`,
        customer_email: email,
        customer_name: `${prenom} ${nom}`,
        return_url: `${process.env.CLIENT_URL}/matching.html`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SASPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (saspayResponse.status === 201) {
      return res.json({ success: true, paymentUrl: saspayResponse.data.checkout_url });
    }

    console.error("Réponse SasPay inattendue:", saspayResponse.status, saspayResponse.data);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  } catch (error) {
    console.error("Erreur SasPay (phone unlock):", error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, error: "Erreur lors de la création du paiement, réessaie plus tard" });
  }
});

export default router;
