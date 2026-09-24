import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpWithEmail } from '../firebase/auth.js';
import './SignupForm.css';

function calculateAge(dateNaissance) {
  const birthDate = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// TODO: sera connecté à Firestore dans le prompt suivant
async function createUserProfile(uid, data) {
}

function SignupForm() {
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [postnom, setPostnom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [age, setAge] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleDateNaissanceChange(e) {
    const value = e.target.value;
    setDateNaissance(value);
    if (value) {
      setAge(calculateAge(value));
    } else {
      setAge(null);
    }
  }

  function validate() {
    const newErrors = {};

    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!postnom.trim()) newErrors.postnom = 'Le postnom est obligatoire.';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';

    if (!dateNaissance) {
      newErrors.dateNaissance = 'La date de naissance est obligatoire.';
    } else {
      const calculatedAge = calculateAge(dateNaissance);
      if (calculatedAge < 18) {
        newErrors.dateNaissance = 'Tu dois avoir au moins 18 ans pour t\'inscrire';
      }
    }

    if (!email.trim()) newErrors.email = 'L\'email est obligatoire.';

    if (!password) {
      newErrors.password = 'Le mot de passe est obligatoire.';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est obligatoire.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) {
      return;
    }

    if (!acceptedTerms) {
      setGlobalError('Tu dois accepter les conditions pour continuer');
      return;
    }

    setLoading(true);

    const result = await signUpWithEmail(email, password);

    if (result.success) {
      const calculatedAge = calculateAge(dateNaissance);
      await createUserProfile(result.user.uid, {
        nom,
        postnom,
        prenom,
        dateNaissance,
        age: calculatedAge,
      });
      setLoading(false);
      navigate('/');
    } else {
      setGlobalError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <form className="signup-card" onSubmit={handleSubmit} noValidate>
        <h2 className="signup-title">Créer un compte</h2>

        {globalError && <p className="signup-global-error" role="alert">{globalError}</p>}

        <div className="signup-field" style={{ animationDelay: '0.05s' }}>
          <label htmlFor="nom">Nom</label>
          <input
            type="text"
            id="nom"
            className={errors.nom ? 'input-error' : ''}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          {errors.nom && <p className="field-error">{errors.nom}</p>}
        </div>

        <div className="signup-field" style={{ animationDelay: '0.1s' }}>
          <label htmlFor="postnom">Postnom</label>
          <input
            type="text"
            id="postnom"
            className={errors.postnom ? 'input-error' : ''}
            value={postnom}
            onChange={(e) => setPostnom(e.target.value)}
          />
          {errors.postnom && <p className="field-error">{errors.postnom}</p>}
        </div>

        <div className="signup-field" style={{ animationDelay: '0.15s' }}>
          <label htmlFor="prenom">Prénom</label>
          <input
            type="text"
            id="prenom"
            className={errors.prenom ? 'input-error' : ''}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />
          {errors.prenom && <p className="field-error">{errors.prenom}</p>}
        </div>

        <div className="signup-field" style={{ animationDelay: '0.2s' }}>
          <label htmlFor="dateNaissance">Date de naissance</label>
          <input
            type="date"
            id="dateNaissance"
            className={errors.dateNaissance ? 'input-error' : ''}
            value={dateNaissance}
            onChange={handleDateNaissanceChange}
          />
          {age !== null && <p key={age} className="age-display">Tu as {age} ans</p>}
          {errors.dateNaissance && <p className="field-error">{errors.dateNaissance}</p>}
        </div>

        <div className="signup-field" style={{ animationDelay: '0.25s' }}>
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

        <div className="signup-field" style={{ animationDelay: '0.3s' }}>
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

        <div className="signup-field" style={{ animationDelay: '0.35s' }}>
          <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
          <input
            type="password"
            id="confirmPassword"
            className={errors.confirmPassword ? 'input-error' : ''}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
        </div>

        <div className="signup-field signup-terms" style={{ animationDelay: '0.4s' }}>
          <label className="signup-terms-label">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              J'ai lu et j'accepte les{' '}
              <Link to="/conditions" target="_blank">conditions générales d'utilisation</Link>
            </span>
          </label>
        </div>

        <button type="submit" className="signup-submit-btn" disabled={loading || !acceptedTerms}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Création en cours...
            </span>
          ) : (
            'Créer un compte'
          )}
        </button>
      </form>
    </div>
  );
}

export default SignupForm;
