import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '../firebase/auth.js';
import './SignupForm.css';
import './LoginForm.css';

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validate() {
    const newErrors = {};

    if (!email.trim()) newErrors.email = 'L\'email est obligatoire.';
    if (!password) newErrors.password = 'Le mot de passe est obligatoire.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email, password);

    if (result.success) {
      setLoading(false);
      navigate('/');
    } else {
      setGlobalError(result.error);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGlobalError('');
    setGoogleLoading(true);

    const result = await signInWithGoogle();

    if (result.success) {
      setGoogleLoading(false);
      navigate('/');
    } else {
      setGlobalError(result.error);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <form className="signup-card" onSubmit={handleSubmit} noValidate>
        <h2 className="signup-title">Se connecter</h2>

        {globalError && <p className="signup-global-error" role="alert">{globalError}</p>}

        <div className="signup-field" style={{ animationDelay: '0.05s' }}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={errors.email ? 'input-error' : ''}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="signup-field" style={{ animationDelay: '0.1s' }}>
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            className={errors.password ? 'input-error' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" className="signup-submit-btn" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Connexion en cours...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <span className="google-icon">G</span>
          {googleLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
        </button>

        <p className="signup-switch-link">
          Pas encore de compte ? <a href="#">Créer un compte</a>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
