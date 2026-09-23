import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getReceivedMessages } from '../firebase/firestore.js';
import UnlockModal from '../components/UnlockModal.jsx';
import './ReceivedMessages.css';

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReceivedMessages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/connexion');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadInitialMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadInitialMessages() {
    setFetching(true);
    setError('');

    const result = await getReceivedMessages(user.uid);

    if (result.success) {
      setMessages(result.messages);
      setLastVisible(result.lastVisible);
      setHasMore(result.messages.length === 10);
    } else {
      setError(result.error);
    }

    setFetching(false);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    setError('');

    const result = await getReceivedMessages(user.uid, lastVisible);

    if (result.success) {
      setMessages((prev) => [...prev, ...result.messages]);
      setLastVisible(result.lastVisible);
      setHasMore(result.messages.length === 10);
    } else {
      setError(result.error);
    }

    setLoadingMore(false);
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/m/${user.uid}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading || !user) {
    return (
      <div className="messages-page">
        <p className="messages-loading">Chargement...</p>
      </div>
    );
  }

  const personalLink = `${window.location.origin}/m/${user.uid}`;

  return (
    <div className="messages-page">
      <div className="messages-container">
        <h1 className="messages-title">Mes messages reçus</h1>

        <div className="share-box">
          <p className="share-label">Ton lien personnel</p>
          <div className="share-link-row">
            <input
              type="text"
              className="share-link-input"
              value={personalLink}
              readOnly
            />
            <button className="share-copy-btn" onClick={handleCopyLink}>
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
          </div>
        </div>

        {error && <p className="messages-error">{error}</p>}

        {fetching ? (
          <p className="messages-loading">Chargement des messages...</p>
        ) : messages.length === 0 ? (
          <p className="messages-empty">Pas encore de message... partage ton lien !</p>
        ) : (
          <>
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg.id} className="message-card">
                  <p className="message-text">{msg.text}</p>
                  <div className="message-footer">
                    <span className="message-date">{formatDate(msg.createdAt)}</span>
                    <button
                      className="reveal-btn"
                      onClick={() => setSelectedMessageId(msg.id)}
                    >
                      Révéler l'identité <span className="reveal-badge">1$</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Chargement...' : 'Voir plus'}
              </button>
            )}
          </>
        )}
      </div>

      {selectedMessageId && (
        <UnlockModal
          messageId={selectedMessageId}
          buyerUid={user.uid}
          onClose={() => setSelectedMessageId(null)}
        />
      )}
    </div>
  );
}

export default ReceivedMessages;
