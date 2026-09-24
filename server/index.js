import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Route webhook SasPay : doit recevoir le BUFFER BRUT (pour la vérification de signature HMAC),
// donc montée AVANT express.json() global, avec son propre middleware express.raw()
app.use('/api/webhooks/saspay', express.raw({ type: 'application/json' }), webhooksRouter);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/payments', paymentsRouter);

// Sert les fichiers vanilla (HTML/CSS/JS) directement depuis client/
// (plus de dossier dist : pas de build, client/ et server/ sont côte à côte à la racine du repo)
app.use(express.static(path.join(__dirname, '../client')));

// Catch-all : toute route qui n'est pas /api/... renvoie index.html,
// pour que la navigation fonctionne même sur un rafraîchissement direct d'une page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
