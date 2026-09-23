import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sendAnonymousMessage } from '../firebase/firestore.js';
import './SendAnonymousMessage.css';

const MAX_LENGTH = 300;

function SendAnonymousMessage() {
  const { uid } = useParams();
  const { user, loading } = useAuth();

  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const remaining = MAX_LENGTH - text.length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!text.trim()) {
      setError('Le message ne peut pas être vide.');
      return;
    }

    setSending(true);

    const result = await sendAnonymousMessage(uid, text.trim(), user.uid);

    if (result.success) {
      setText('');
      setSuccess(true);
    } else {
      setError(result.error);
    }

    setSending(false);
  }

  if (loading) {
    return (
      <div className="anon-page">
        <p className="anon-loading">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="anon-page">
        <div className="anon-card">
          <h1 className="anon-title">Envoie-moi un message anonyme 🍟</h1>
          <p className="anon-login-text">Connecte-toi pour envoyer ce message</p>
          <Link to="/connexion" className="anon-login-btn">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="anon-page">
      <div className="anon-card">
        <h1 className="anon-title">Envoie-moi un message anonyme 🍟</h1>

        {error && <p className="anon-error" role="alert">{error}</p>}
        {success && <p className="anon-success">Message envoyé ! 🎉</p>}

        <form onSubmit={handleSubmit} noValidate>
          <textarea
            className="anon-textarea"
            value={text}
            maxLength={MAX_LENGTH}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écris ton message ici..."
            rows={5}
          />
          <p className="anon-counter">{remaining} caractères restants</p>

          <button type="submit" className="anon-submit-btn" disabled={sending}>
            {sending ? (
              <span className="anon-btn-loading">
                <span className="anon-spinner"></span>
                Envoi en cours...
              </span>
            ) : (
              'Envoyer anonymement'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SendAnonymousMessage;
