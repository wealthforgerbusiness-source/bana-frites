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

// ============================================================
// PWA — manifest + service worker
// Injectés en JS pour ne pas avoir à modifier chaque page HTML.
// ============================================================

if (!document.querySelector('link[rel="manifest"]')) {
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);
}

if (!document.querySelector('meta[name="theme-color"]')) {
  const themeColorMeta = document.createElement('meta');
  themeColorMeta.name = 'theme-color';
  themeColorMeta.content = '#E4231C';
  document.head.appendChild(themeColorMeta);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Échec de l’enregistrement du service worker :', error);
    });
  });
}

// ============================================================
// Bandeau "ouvre dans ton navigateur" — TikTok, Instagram, Facebook
// Ces navigateurs intégrés (webviews) bloquent souvent les redirections
// de paiement et les notifications push : on invite à ouvrir dans le
// vrai navigateur (Chrome, Safari...).
// ============================================================

function detectInAppBrowser() {
  const ua = navigator.userAgent || '';

  if (/musical_ly|TikTok/i.test(ua)) return 'TikTok';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';

  return null;
}

function showInAppBrowserBanner(appName) {
  if (sessionStorage.getItem('inAppBannerDismissed') === 'true') return;

  const banner = document.createElement('div');
  banner.id = 'inAppBrowserBanner';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #1a1a1a;
    color: #fff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  `;

  const text = document.createElement('span');
  text.textContent = `Tu es sur ${appName} : pour que les paiements et notifications marchent bien, ouvre ce lien dans ton navigateur (menu ⋯ ou ⋮ en haut à droite → "Ouvrir dans le navigateur").`;
  text.style.cssText = 'flex: 1; line-height: 1.4;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Fermer');
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
    padding: 4px 8px;
  `;
  closeBtn.addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('inAppBannerDismissed', 'true');
  });

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
  document.body.style.paddingTop = `${banner.offsetHeight}px`;
}

const detectedApp = detectInAppBrowser();
if (detectedApp) {
  showInAppBrowserBanner(detectedApp);
}
