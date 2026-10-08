import { Router } from "express";
import { db, admin } from "../firebaseAdmin.js";
import { Timestamp, AggregateField } from "firebase-admin/firestore";

const router = Router();

// Liste des uid administrateurs (variable d'environnement ADMIN_UIDS, séparés par des virgules).
// Si la variable est absente ou vide, PERSONNE n'est admin (refus par défaut).
function getAdminUids() {
  return (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

// Vérifie le token Firebase ET que l'uid fait partie des admins.
async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentification requise." });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice("Bearer ".length));

    if (!getAdminUids().includes(decoded.uid)) {
      return res.status(403).json({ success: false, error: "Accès réservé à l'administrateur." });
    }

    req.authUid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée. Reconnecte-toi." });
  }
}

const PAYMENT_TYPES = ["message", "phone", "bio"];
const DAY_MS = 24 * 60 * 60 * 1000;

router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const now = Date.now();
    const nowTs = Timestamp.fromMillis(now);
    const sevenDaysTs = Timestamp.fromMillis(now - 7 * DAY_MS);
    const thirtyDaysTs = Timestamp.fromMillis(now - 30 * DAY_MS);

    const paymentsCol = db.collection("payments");

    const [totalUsersSnap, newUsersSnap, activeBioSnap, recentSnap, last30Snap, ...typeSnaps] =
      await Promise.all([
        db.collection("users").count().get(),
        db.collection("users").where("createdAt", ">=", sevenDaysTs).count().get(),
        // Un panel est actif tant que sa date d'expiration est dans le futur
        db.collection("bioPanels").where("expiresAt", ">", nowTs).count().get(),
        paymentsCol.orderBy("createdAt", "desc").limit(10).get(),
        paymentsCol.where("createdAt", ">=", thirtyDaysTs).orderBy("createdAt", "desc").limit(2000).get(),
        ...PAYMENT_TYPES.map((type) =>
          paymentsCol
            .where("type", "==", type)
            .aggregate({
              count: AggregateField.count(),
              net: AggregateField.sum("net"),
              gross: AggregateField.sum("requested"),
            })
            .get()
        ),
      ]);

    const byType = {};
    let paymentsCount = 0;
    let netTotal = 0;
    let grossTotal = 0;

    PAYMENT_TYPES.forEach((type, index) => {
      const data = typeSnaps[index].data();
      byType[type] = { count: data.count, net: data.net || 0 };
      paymentsCount += data.count;
      netTotal += data.net || 0;
      grossTotal += data.gross || 0;
    });

    let last30Net = 0;
    last30Snap.forEach((doc) => {
      last30Net += Number(doc.data().net) || 0;
    });

    const activePanels = activeBioSnap.data().count;
    const bioPrice = Number(process.env.SASPAY_BIO_SUBSCRIPTION_AMOUNT) || 0;

    const recent = recentSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        type: data.type,
        net: Number(data.net) || 0,
        currency: data.currency || "",
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : null,
      };
    });

    return res.json({
      success: true,
      currency: process.env.SASPAY_CURRENCY || "",
      users: { total: totalUsersSnap.data().count, new7d: newUsersSnap.data().count },
      payments: {
        count: paymentsCount,
        netTotal,
        grossTotal,
        last30: { count: last30Snap.size, net: last30Net },
      },
      byType,
      bio: { activePanels, mrr: activePanels * bioPrice },
      recent,
    });
  } catch (error) {
    console.error("Erreur /api/admin/stats :", error.message);
    return res.status(500).json({ success: false, error: "Impossible de charger les statistiques." });
  }
});

export default router;
