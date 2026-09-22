import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="header">
        <Link to="/">
          <img src={logo} alt="Bana Frites" className="header-logo" />
        </Link>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
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
          <li><Link to="/connexion" onClick={() => setMenuOpen(false)}>Connexion / Créer un compte</Link></li>
        </ul>
      </nav>
    </>
  )
}

export default Header
