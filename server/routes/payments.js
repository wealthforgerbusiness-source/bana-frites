import { Router } from "express";
import axios from "axios";
import { db } from "../firebaseAdmin.js";

const router = Router();

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

export default router;
