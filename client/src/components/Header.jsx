import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { signOutUser } from '../firebase/auth.js'
import logo from '../assets/logo.png'
import './Header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOutUser()
    setMenuOpen(false)
    navigate('/')
  }

  const displayName = user ? (user.displayName || user.email) : null

  return (
    <>
      <header className="header">
        <Link to="/">
          <img src={logo} alt="Bana Frites" className="header-logo" />
        </Link>

        <div className="header-right">
          {!loading && (
            user ? (
              <div className="header-user">
                <Link to="/mes-messages" className="header-messages-link">
                  Mes messages
                </Link>
                <span className="header-username">{displayName}</span>
                <button className="header-signout-btn" onClick={handleSignOut}>
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link to="/connexion" className="header-login-link">
                Connexion / Créer un compte
              </Link>
            )
          )}

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className={`nav-overlay ${menuOpen ? 'nav-overlay-visible' : ''}`} onClick={() => setMenuOpen(false)}></div>

      <nav className={`nav-panel ${menuOpen ? 'nav-panel-open' : ''}`}>
        <button
          className="nav-close-btn"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
        >
          ✕
        </button>
        <ul className="nav-links">
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li><a href="#">Message anonyme</a></li>
          <li><a href="#">Matching</a></li>
          <li><a href="#">Jeu couple</a></li>

          {!loading && (
            user ? (
              <>
                <li><Link to="/mes-messages" onClick={() => setMenuOpen(false)}>Mes messages</Link></li>
                <li className="nav-user-info">{displayName}</li>
                <li>
                  <button className="nav-signout-btn" onClick={handleSignOut}>
                    Déconnexion
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/connexion" onClick={() => setMenuOpen(false)}>
                  Connexion / Créer un compte
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </>
  )
}

export default Header
