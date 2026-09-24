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
