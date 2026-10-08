import { Router } from "express";
import crypto from "crypto";
import axios from "axios";
import { db, admin } from "../firebaseAdmin.js";

const router = Router();

function isValidSignature(rawBody, signatureHeader, timestampHeader, secret) {
  if (!signatureHeader || !timestampHeader) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(timestampHeader, 10);

  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

router.post("/saspay", async (req, res) => {
  const signatureHeader = req.headers["x-webhook-signature"];
  const timestampHeader = req.headers["x-webhook-timestamp"];
  const eventHeader = req.headers["x-webhook-event"];

  const rawBody = req.body;

  const valid = isValidSignature(
    rawBody,
    signatureHeader,
    timestampHeader,
    process.env.SASPAY_WEBHOOK_SECRET
  );

  if (!valid) {
    return res.status(403).send("Invalid signature");
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    console.error("Webhook SasPay : impossible de parser le body JSON.", error);
    return res.status(200).send("ok");
  }

  if (eventHeader !== "transaction.success") {
    return res.status(200).send("ignored");
  }

  try {
    const transactionId = payload.data && payload.data.id;

    if (!transactionId) {
      console.error("Webhook SasPay : transaction.id manquant dans le payload.", payload);
      return res.status(200).send("ok");
    }

    const transactionResponse = await axios.get(
      `https://api.saspay.me/api/v1/transactions/${transactionId}/`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SASPAY_API_KEY}`,
        },
      }
    );

    const transaction = transactionResponse.data;
    const description = transaction.description || "";

    const unlockMessageMatch = description.match(/^unlock:(.+)$/);
    const unlockPhoneMatch = description.match(/^unlock-phone:([^:]+):(.+)$/);
    const bioSubscribeMatch = description.match(/^bio-subscribe:(.+)$/);

    // Enregistre le paiement réel (montants fournis par SasPay) pour le dashboard admin.
    // Le document a pour id le transactionId : si SasPay renvoie le webhook, aucun doublon.
    try {
      let paymentType = null;
      let paymentUid = null;
      let paymentRef = null;

      if (unlockMessageMatch) {
        paymentType = "message";
        paymentRef = unlockMessageMatch[1];
      } else if (unlockPhoneMatch) {
        paymentType = "phone";
        paymentRef = unlockPhoneMatch[1];
        paymentUid = unlockPhoneMatch[2];
      } else if (bioSubscribeMatch) {
        paymentType = "bio";
        paymentUid = bioSubscribeMatch[1];
        paymentRef = bioSubscribeMatch[1];
      }

      if (paymentType) {
        const paymentDocRef = db.collection("payments").doc(String(transactionId));
        const paymentDocSnap = await paymentDocRef.get();

        if (!paymentDocSnap.exists) {
          await paymentDocRef.set({
            transactionId: String(transactionId),
            type: paymentType,
            uid: paymentUid,
            refId: paymentRef,
            requested: Number(transaction.requested_amount) || 0,
            net: Number(transaction.net_amount) || 0,
            fee: Number(transaction.client_fee) || 0,
            currency: transaction.currency || "",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (recordError) {
      console.error("Webhook SasPay : enregistrement du paiement échoué.", recordError.message);
    }

    if (unlockMessageMatch) {
      const messageId = unlockMessageMatch[1];

      const messageRef = db.collection("messages").doc(messageId);
      const messageSnap = await messageRef.get();

      if (!messageSnap.exists) {
        console.error(`Webhook SasPay : message ${messageId} introuvable.`);
        return res.status(200).send("ok");
      }

      const messageData = messageSnap.data();

      if (messageData.revealed === true) {
        return res.status(200).send("already processed");
      }

      const senderRef = db.collection("messageSenders").doc(messageId);
      const senderSnap = await senderRef.get();

      if (!senderSnap.exists) {
        console.error(`Webhook SasPay : messageSenders/${messageId} introuvable.`);
        return res.status(200).send("ok");
      }

      const { fromUid } = senderSnap.data();

      const senderUserRef = db.collection("users").doc(fromUid);
      const senderUserSnap = await senderUserRef.get();

      if (!senderUserSnap.exists) {
        console.error(`Webhook SasPay : users/${fromUid} introuvable.`);
        return res.status(200).send("ok");
      }

      const { nom, prenom } = senderUserSnap.data();

      await messageRef.update({
        revealed: true,
        revealedSenderName: `${prenom} ${nom}`,
        revealedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).send("ok");
    }

    if (unlockPhoneMatch) {
      const matchId = unlockPhoneMatch[1];
      const uid = unlockPhoneMatch[2];

      const matchRef = db.collection("matches").doc(matchId);
      const matchSnap = await matchRef.get();

      if (!matchSnap.exists) {
        console.error(`Webhook SasPay : match ${matchId} introuvable.`);
        return res.status(200).send("ok");
      }

      const matchData = matchSnap.data();

      let revealedField;
      if (matchData.userA === uid) {
        revealedField = "phoneRevealedA";
      } else if (matchData.userB === uid) {
        revealedField = "phoneRevealedB";
      } else {
        console.error(`Webhook SasPay : uid ${uid} ne fait pas partie du match ${matchId}.`);
        return res.status(200).send("ok");
      }

      if (matchData[revealedField] === true) {
        return res.status(200).send("already processed");
      }

      await matchRef.update({ [revealedField]: true });

      return res.status(200).send("ok");
    }

    if (bioSubscribeMatch) {
      const bioUid = bioSubscribeMatch[1];

      const bioRef = db.collection("bioPanels").doc(bioUid);
      const bioSnap = await bioRef.get();
      const bioData = bioSnap.exists ? bioSnap.data() : {};

      // Anti-doublon : SasPay peut renvoyer le même webhook plusieurs fois
      if (bioData.lastTransactionId === transactionId) {
        return res.status(200).send("already processed");
      }

      // Renouvellement : on prolonge depuis la date d'expiration si le panel est encore actif
      const now = Date.now();
      const currentExpiry =
        bioData.expiresAt && typeof bioData.expiresAt.toMillis === "function"
          ? bioData.expiresAt.toMillis()
          : 0;
      const startFrom = Math.max(now, currentExpiry);
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      await bioRef.set(
        {
          active: true,
          expiresAt: admin.firestore.Timestamp.fromMillis(startFrom + THIRTY_DAYS_MS),
          lastTransactionId: transactionId,
          lastPaidAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(200).send("ok");
    }

    console.error("Webhook SasPay : description de transaction au mauvais format.", description);
    return res.status(200).send("ok");
  } catch (error) {
    console.error(
      "Webhook SasPay : erreur inattendue lors du traitement.",
      error.response ? error.response.data : error.message
    );
    return res.status(200).send("ok");
  }
});

export default router;
