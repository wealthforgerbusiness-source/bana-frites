// Menu hamburger : ouverture / fermeture du panneau de navigation
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

// Animation d'apparition des cartes au scroll (Intersection Observer natif)
const cards = document.querySelectorAll('.card');

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

cards.forEach((card) => cardObserver.observe(card));
