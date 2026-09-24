import { onAuthChange } from "./auth.js";

const NAV_ITEMS = [
  {
    href: "/index.html",
    label: "Accueil",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9.5 20v-6h5v6"/></svg>`,
  },
  {
    href: "/messages.html",
    label: "Messages",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  },
  {
    href: "/matching.html",
    label: "Matching",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.35-9.5-8.5C.8 8.2 2.2 5 5.5 5c1.8 0 3.2 1 4.5 2.5C11.3 6 12.7 5 14.5 5 17.8 5 19.2 8.2 21.5 11.5 19 15.65 12 20 12 20Z"/></svg>`,
  },
  {
    href: "/couple.html",
    label: "Jeu couple",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18s-5-3.1-6.8-6C.7 9.7 1.5 7 3.8 7c1.3 0 2.2.8 2.2 1.8"/><path d="M15 18s5-3.1 6.8-6c1.5-2.3.7-5-1.6-5-1.3 0-2.2.8-2.2 1.8"/><path d="M9 18c0-3 1.3-5 3-5s3 2 3 5"/></svg>`,
  },
  {
    href: "/profil.html",
    label: "Profil",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  },
];

function isActivePath(href) {
  return window.location.pathname === href;
}

function buildBottomNav(user) {
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.id = "bottomNav";

  NAV_ITEMS.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.className = "bottom-nav-item";
    if (isActivePath(item.href)) {
      link.classList.add("bottom-nav-active");
    }

    const iconWrapper = document.createElement("span");
    iconWrapper.className = "bottom-nav-icon";

    if (item.href === "/profil.html" && user.photoURL) {
      const img = document.createElement("img");
      img.src = user.photoURL;
      img.alt = "";
      img.className = "bottom-nav-avatar";
      iconWrapper.appendChild(img);
    } else {
      // SVG fixe défini par nous-mêmes (pas de contenu utilisateur) : innerHTML sûr ici
      iconWrapper.innerHTML = item.icon;
    }

    const labelEl = document.createElement("span");
    labelEl.className = "bottom-nav-label";
    labelEl.textContent = item.label; // texte statique, mais textContent par principe

    link.appendChild(iconWrapper);
    link.appendChild(labelEl);
    nav.appendChild(link);
  });

  return nav;
}

function removeExistingBottomNav() {
  const existing = document.getElementById("bottomNav");
  if (existing) {
    existing.remove();
  }
  document.body.classList.remove("has-bottom-nav");
}

onAuthChange((user) => {
  removeExistingBottomNav();

  if (user) {
    const nav = buildBottomNav(user);
    document.body.appendChild(nav);
    document.body.classList.add("has-bottom-nav");
  }
});
