import React, { useState } from 'react';
import { signUpWithEmail } from '../firebase/auth.js';

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
  const [nom, setNom] = useState('');
  const [postnom, setPostnom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [age, setAge] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      if (calculatedAge < 13) {
        newErrors.dateNaissance = 'Tu dois avoir au moins 13 ans pour t\'inscrire';
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
    } else {
      setGlobalError(result.error);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Créer un compte</h2>

      {globalError && <p role="alert">{globalError}</p>}

      <div>
        <label htmlFor="nom">Nom</label>
        <input
          type="text"
          id="nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        {errors.nom && <p>{errors.nom}</p>}
      </div>

      <div>
        <label htmlFor="postnom">Postnom</label>
        <input
          type="text"
          id="postnom"
          value={postnom}
          onChange={(e) => setPostnom(e.target.value)}
        />
        {errors.postnom && <p>{errors.postnom}</p>}
      </div>

      <div>
        <label htmlFor="prenom">Prénom</label>
        <input
          type="text"
          id="prenom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
        />
        {errors.prenom && <p>{errors.prenom}</p>}
      </div>

      <div>
        <label htmlFor="dateNaissance">Date de naissance</label>
        <input
          type="date"
          id="dateNaissance"
          value={dateNaissance}
          onChange={handleDateNaissanceChange}
        />
        {age !== null && <p>Tu as {age} ans</p>}
        {errors.dateNaissance && <p>{errors.dateNaissance}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password">Mot de passe</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p>{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassword && <p>{errors.confirmPassword}</p>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Création en cours...' : 'Créer un compte'}
      </button>
    </form>
  );
}

export default SignupForm;
