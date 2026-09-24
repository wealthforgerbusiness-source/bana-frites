// Menu hamburger : ouverture / fermeture du panneau de navigation (mobile uniquement)
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navCloseBtn = document.getElementById('navCloseBtn');
const navPanel = document.getElementById('navPanel');
const navOverlay = document.getElementById('navOverlay');

function openMenu() {
  navPanel.classList.add('nav-panel-open');
  navOverlay.classList.add('nav-overlay-visible');
}

function closeMenu() {
  navPanel.classList.remove('nav-panel-open');
  navOverlay.classList.remove('nav-overlay-visible');
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', openMenu);
}

if (navCloseBtn) {
  navCloseBtn.addEventListener('click', closeMenu);
}

if (navOverlay) {
  navOverlay.addEventListener('click', closeMenu);
}

// Sécurité : si la fenêtre passe en desktop (>=768px) pendant que le panneau
// mobile est ouvert, on le referme pour éviter un overlay bloqué à l'écran.
const desktopBreakpoint = window.matchMedia('(min-width: 768px)');
desktopBreakpoint.addEventListener('change', (e) => {
  if (e.matches) closeMenu();
});

// Animation d'apparition des cartes au scroll (Intersection Observer natif)
// IMPORTANT : la classe ajoutée ici doit correspondre à celle utilisée
// dans css/style.css (.card.card-visible), sinon les cartes restent invisibles.
const cards = document.querySelectorAll('.card');

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('card-visible');
        cardObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

cards.forEach((card) => cardObserver.observe(card));
