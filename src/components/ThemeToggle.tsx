"use client";

import { useSyncExternalStore } from "react";

// document.documentElement.classList est une vraie source externe (peut changer via le script
// anti-flash au chargement, ou un autre onglet) — useSyncExternalStore évite tout écart
// d'hydratation entre le rendu serveur et le premier rendu client (voir ThemeScript.tsx).
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // Stockage indisponible (navigation privée...) : le thème choisi ne survivra pas au
    // rechargement, mais le bouton continue de fonctionner pour la session en cours.
  }
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      className="fixed right-4 top-4 z-50 rounded-full border bg-white px-3 py-2 text-lg shadow-sm hover:bg-gray-50"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
