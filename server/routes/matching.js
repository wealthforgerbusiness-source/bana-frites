import { Router } from "express";
import { db, admin } from "../firebaseAdmin.js";

const router = Router();

class MatchingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function getActiveMatchForUid(uid) {
  const [asA, asB] = await Promise.all([
    db.collection("matches").where("userA", "==", uid).where("status", "==", "active").limit(1).get(),
    db.collection("matches").where("userB", "==", uid).where("status", "==", "active").limit(1).get(),
  ]);

  if (!asA.empty) {
    return { id: asA.docs[0].id, data: asA.docs[0].data() };
  }
  if (!asB.empty) {
    return { id: asB.docs[0].id, data: asB.docs[0].data() };
  }
  return null;
}

// 1. POST /join-queue
router.post("/join-queue", async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "uid est obligatoire." });
  }

  try {
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return res.status(400).json({ error: "Profil introuvable." });
    }

    const sexe = userSnap.data().sexe;

    if (sexe !== "garcon" && sexe !== "fille") {
      return res.status(400).json({ error: "Le sexe du profil est invalide ou manquant." });
    }

    const existingMatch = await getActiveMatchForUid(uid);
    if (existingMatch) {
      return res.json({ alreadyMatched: true, matchId: existingMatch.id });
    }

    const oppositeSexe = sexe === "garcon" ? "fille" : "garcon";

    const matchId = await db.runTransaction(async (tx) => {
      const queueQuery = db
        .collection("matchQueue")
        .where("sexe", "==", oppositeSexe)
        .orderBy("createdAt", "asc")
        .limit(1);

      const queueSnap = await tx.get(queueQuery);

      if (queueSnap.empty) {
        const selfRef = db.collection("matchQueue").doc(uid);
        tx.set(selfRef, {
          uid,
          sexe,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      const otherDoc = queueSnap.docs[0];
      const otherUid = otherDoc.id;
      const otherSexe = otherDoc.data().sexe;

      tx.delete(otherDoc.ref);

      const matchRef = db.collection("matches").doc();
      tx.set(matchRef, {
        userA: otherUid,
        sexeA: otherSexe,
        userB: uid,
        sexeB: sexe,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
        messagesCountA: 0,
        messagesCountB: 0,
        decisionA: null,
        decisionB: null,
        phoneRevealedA: false,
        phoneRevealedB: false,
      });

      return matchRef.id;
    });

    if (matchId) {
      return res.json({ matched: true, matchId });
    }

    return res.json({ matched: false, waiting: true });
  } catch (error) {
    console.error("Erreur /join-queue :", error);
    return res.status(500).json({ error: "Impossible de rejoindre la file d'attente. Veuillez réessayer." });
  }
});

// 2. GET /status/:uid
router.get("/status/:uid", async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ error: "uid est obligatoire." });
  }

  try {
    const activeMatch = await getActiveMatchForUid(uid);

    if (activeMatch) {
      return res.json({
        matched: true,
        waiting: false,
        matchId: activeMatch.id,
        status: activeMatch.data.status,
        userA: activeMatch.data.userA,
        userB: activeMatch.data.userB,
        messagesCountA: activeMatch.data.messagesCountA,
        messagesCountB: activeMatch.data.messagesCountB,
        decisionA: activeMatch.data.decisionA,
        decisionB: activeMatch.data.decisionB,
        readyForDecision: activeMatch.data.readyForDecision || false,
      });
    }

    const queueSnap = await db.collection("matchQueue").doc(uid).get();

    if (queueSnap.exists) {
      return res.json({ matched: false, waiting: true });
    }

    return res.json({ matched: false, waiting: false });
  } catch (error) {
    console.error("Erreur /status :", error);
    return res.status(500).json({ error: "Impossible de récupérer le statut. Veuillez réessayer." });
  }
});

// 3. POST /leave-queue
router.post("/leave-queue", async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "uid est obligatoire." });
  }

  try {
    await db.collection("matchQueue").doc(uid).delete();
    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur /leave-queue :", error);
    return res.status(500).json({ error: "Impossible de quitter la file d'attente. Veuillez réessayer." });
  }
});

// 4. POST /send-message
router.post("/send-message", async (req, res) => {
  const { matchId, uid, text } = req.body;

  if (!matchId || !uid || !text || !text.trim()) {
    return res.status(400).json({ error: "matchId, uid et text sont obligatoires." });
  }

  try {
    await db.runTransaction(async (tx) => {
      const matchRef = db.collection("matches").doc(matchId);
      const matchSnap = await tx.get(matchRef);

      if (!matchSnap.exists) {
        throw new MatchingError(400, "Match introuvable.");
      }

      const data = matchSnap.data();

      if (data.status !== "active") {
        throw new MatchingError(400, "Ce match n'est plus actif.");
      }

      let role;
      if (data.userA === uid) {
        role = "A";
      } else if (data.userB === uid) {
        role = "B";
      } else {
        throw new MatchingError(403, "Vous ne faites pas partie de ce match.");
      }

      const countField = role === "A" ? "messagesCountA" : "messagesCountB";
      const otherCountField = role === "A" ? "messagesCountB" : "messagesCountA";
      const currentCount = data[countField];

      if (currentCount >= 3) {
        throw new MatchingError(400, "Tu as déjà envoyé tes 3 messages");
      }

      const newCount = currentCount + 1;
      const otherCount = data[otherCountField];

      const msgRef = matchRef.collection("messages").doc();
      tx.set(msgRef, {
        senderUid: uid,
        text: text.trim(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updateData = { [countField]: newCount };

      if (newCount + otherCount >= 6) {
        updateData.readyForDecision = true;
      }

      tx.update(matchRef, updateData);
    });

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof MatchingError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Erreur /send-message :", error);
    return res.status(500).json({ error: "Impossible d'envoyer le message. Veuillez réessayer." });
  }
});

// 5. POST /decision
router.post("/decision", async (req, res) => {
  const { matchId, uid, decision } = req.body;

  if (!matchId || !uid || !decision) {
    return res.status(400).json({ error: "matchId, uid et decision sont obligatoires." });
  }

  if (decision !== "oui" && decision !== "non") {
    return res.status(400).json({ error: "decision doit être 'oui' ou 'non'." });
  }

  try {
    const resultStatus = await db.runTransaction(async (tx) => {
      const matchRef = db.collection("matches").doc(matchId);
      const matchSnap = await tx.get(matchRef);

      if (!matchSnap.exists) {
        throw new MatchingError(400, "Match introuvable.");
      }

      const data = matchSnap.data();

      let role;
      if (data.userA === uid) {
        role = "A";
      } else if (data.userB === uid) {
        role = "B";
      } else {
        throw new MatchingError(403, "Vous ne faites pas partie de ce match.");
      }

      const decisionField = role === "A" ? "decisionA" : "decisionB";
      const otherDecisionField = role === "A" ? "decisionB" : "decisionA";
      const otherDecision = data[otherDecisionField];

      const updateData = { [decisionField]: decision };
      let status;

      if (decision === "non" || otherDecision === "non") {
        updateData.status = "ended";
        status = "ended";
      } else if (decision === "oui" && otherDecision === "oui") {
        updateData.status = "matched_confirmed";
        status = "confirmed";
      } else {
        status = "waiting";
      }

      tx.update(matchRef, updateData);

      return status;
    });

    if (resultStatus === "confirmed") {
      return res.json({ success: true, bothConfirmed: true });
    }
    if (resultStatus === "ended") {
      return res.json({ success: true, bothConfirmed: false, ended: true });
    }
    return res.json({ success: true, waitingForOther: true });
  } catch (error) {
    if (error instanceof MatchingError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Erreur /decision :", error);
    return res.status(500).json({ error: "Impossible d'enregistrer la décision. Veuillez réessayer." });
  }
});

export default router;
