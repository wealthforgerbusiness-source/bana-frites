const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir le build React en statique (à activer une fois client/dist généré)
// app.use(express.static(path.join(__dirname, 'client/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
