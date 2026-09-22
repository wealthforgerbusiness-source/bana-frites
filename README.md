# Bana Frites

PWA destinée aux jeunes de Kinshasa, permettant l'envoi de messages anonymes, le matching entre utilisateurs et un jeu couple interactif.

## Stack technique

- **Client** : React + Vite
- **Server** : Node.js + Express
- **Base de données & Auth** : Firebase

## Installation

### Client

```bash
cd client
npm install
```

### Server

```bash
cd server
npm install
```

## Lancer le projet en local

### 1. Serveur de développement client (port 5173)

```bash
cd client
npm run dev
```

### 2. Serveur Express (port 5000)

```bash
cd server
npm start
```

L'application sera accessible sur `http://localhost:5173`, avec les appels API proxifiés vers `http://localhost:5000`.

## Déploiement

Ce projet est destiné à être déployé sur **Render**.
