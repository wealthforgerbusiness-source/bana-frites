import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserProfile, updateUserDescription } from '../firebase/firestore.js';
import './ProfilePage.css';

const MAX_LENGTH = 200;

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/connexion');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadProfile() {
    setFetching(true);
    setFetchError('');

    const result = await getUserProfile(user.uid);

    if (result.success) {
      setProfile(result.data);
      setDescription(result.data.description || '');
    } else {
      setFetchError(result.error);
    }

    setFetching(false);
  }

  async function handleSave() {
    setSaveError('');
    setSaveSuccess(false);
    setSaving(true);

    const result = await updateUserDescription(user.uid, description);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      setSaveError(result.error);
    }

    setSaving(false);
  }

  if (loading || !user) {
    return (
      <div className="profile-page">
        <p className="profile-loading">Chargement...</p>
      </div>
    );
  }

  const remaining = MAX_LENGTH - description.length;
  const initial = profile?.prenom ? profile.prenom.charAt(0).toUpperCase() : '?';

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">Mon profil</h1>

        {fetching ? (
          <p className="profile-loading">Chargement du profil...</p>
        ) : fetchError ? (
          <p className="profile-error">{fetchError}</p>
        ) : (
          <>
            <div className="profile-avatar-block">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Photo de profil" className="profile-avatar-img" />
              ) : (
                <>
                  <div className="profile-avatar-placeholder">{initial}</div>
                  <p className="profile-avatar-hint">
                    Connecte-toi avec Google pour avoir une photo automatique
                  </p>
                </>
              )}
            </div>

            <div className="profile-readonly-fields">
              <div className="profile-readonly-field">
                <span className="profile-readonly-label">Nom</span>
                <span className="profile-readonly-value">{profile?.nom}</span>
              </div>
              <div className="profile-readonly-field">
                <span className="profile-readonly-label">Prénom</span>
                <span className="profile-readonly-value">{profile?.prenom}</span>
              </div>
            </div>

            <div className="profile-description-block">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="profile-textarea"
                value={description}
                maxLength={MAX_LENGTH}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Parle un peu de toi..."
              />
              <p className="profile-counter">{remaining} caractères restants</p>

              {saveError && <p className="profile-error">{saveError}</p>}
              {saveSuccess && <p className="profile-success">Profil mis à jour !</p>}

              <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="profile-btn-loading">
                    <span className="profile-spinner"></span>
                    Enregistrement...
                  </span>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
