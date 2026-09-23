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

// Servir le build React en statique (à activer une fois client/dist généré)
// app.use(express.static(path.join(__dirname, 'client/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
