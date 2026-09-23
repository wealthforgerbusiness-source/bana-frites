import React, { useState } from 'react';
import './UnlockModal.css';

function UnlockModal({ messageId, buyerUid, onClose }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function isValidPhone(value) {
    return /^\d{9,}$/.test(value);
  }

  async function handlePay() {
    setError('');

    if (!isValidPhone(phone)) {
      setError('Veuillez entrer un numéro valide (au moins 9 chiffres).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payments/create-unlock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, buyerUid, phone }),
      });

      const data = await res.json();

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Impossible de créer le paiement. Veuillez réessayer.');
        setLoading(false);
      }
    } catch (err) {
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  }

  return (
    <div className="unlock-overlay" onClick={onClose}>
      <div className="unlock-card" onClick={(e) => e.stopPropagation()}>
        <button className="unlock-close-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className="unlock-icon">🔒</div>
        <h2 className="unlock-title">Débloque cette identité</h2>
        <p className="unlock-text">
          Découvre qui t'a envoyé ce message pour seulement 1$
        </p>

        {error && <p className="unlock-error" role="alert">{error}</p>}

        <div className="unlock-field">
          <label htmlFor="phone">Numéro Mobile Money</label>
          <input
            type="tel"
            id="phone"
            placeholder="Ex: 09XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button className="unlock-pay-btn" onClick={handlePay} disabled={loading}>
          {loading ? (
            <span className="unlock-btn-loading">
              <span className="unlock-spinner"></span>
              Traitement en cours...
            </span>
          ) : (
            'Payer avec Mobile Money'
          )}
        </button>

        <button className="unlock-cancel-link" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default UnlockModal;
