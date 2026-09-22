import React, { useState, useEffect, useRef } from 'react'
import logo from './assets/logo.png'
import hero from './assets/hero.png'
import imgMessageAnonyme from './assets/image-message-anonyme.png'
import imgMatching from './assets/image-matching.png'
import imgJeuCouple from './assets/image-jeu-couple.png'
import './App.css'

function AnimatedCard({ children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`card ${visible ? 'card-visible' : ''}`}>
      {children}
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="header">
        <img src={logo} alt="Bana Frites" className="header-logo" />
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
          <li><a href="#">Accueil</a></li>
          <li><a href="#">Message anonyme</a></li>
          <li><a href="#">Matching</a></li>
          <li><a href="#">Jeu couple</a></li>
          <li><a href="#">Connexion / Créer un compte</a></li>
        </ul>
      </nav>

      <section className="hero" style={{ backgroundImage: `url(${hero})` }}>
        <div className="hero-overlay">
          <img src={logo} alt="Bana Frites" className="hero-logo" />
          <h1 className="hero-title">Bana Frites</h1>
          <p className="hero-subtitle">
            La plateforme qui connecte les jeunes de Kinshasa : messages anonymes, matching et jeux à deux.
          </p>
          <button className="cta-btn">Créer un compte</button>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">Comment ça marche</h2>
        <div className="cards-grid">
          <AnimatedCard>
            <img src={imgMessageAnonyme} alt="Message anonyme" className="card-image" />
            <h3 className="card-title">Message anonyme</h3>
            <p className="card-desc">Envoie un message sans révéler ton identité et crée la surprise.</p>
          </AnimatedCard>
          <AnimatedCard>
            <img src={imgMatching} alt="Matching" className="card-image" />
            <h3 className="card-title">Matching</h3>
            <p className="card-desc">Trouve des profils qui te correspondent et fais de nouvelles rencontres.</p>
          </AnimatedCard>
          <AnimatedCard>
            <img src={imgJeuCouple} alt="Jeu couple" className="card-image" />
            <h3 className="card-title">Jeu couple</h3>
            <p className="card-desc">Joue en duo et découvre ton affinité avec ton match.</p>
          </AnimatedCard>
        </div>
      </section>

      <footer className="footer">
        <img src={logo} alt="Bana Frites" className="footer-logo" />
        <p className="footer-text">© 2026 Bana Frites</p>
        <div className="footer-socials">
          <span className="social-icon"></span>
          <span className="social-icon"></span>
          <span className="social-icon"></span>
          <span className="social-icon"></span>
        </div>
      </footer>
    </>
  )
}

export default App
