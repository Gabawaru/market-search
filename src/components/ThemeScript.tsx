// Script bloquant placé dans <head> : applique la classe .dark AVANT le premier rendu, pour
// éviter un flash du mauvais thème. Respecte le choix explicite mémorisé (localStorage), sinon
// suit la préférence système.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
