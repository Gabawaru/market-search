import type { CapacitorConfig } from "@capacitor/cli";

// Mode "remote URL" : l'app Android est une coque native qui affiche le site en ligne dans une
// WebView — elle ne contient aucune copie du code. Toute mise à jour déployée sur Vercel est donc
// visible immédiatement au prochain lancement de l'app, sans jamais reconstruire l'APK.
const config: CapacitorConfig = {
  appId: "fr.oumnoeducation.app",
  appName: "Oumno Éducation",
  webDir: "www",
  server: {
    url: "https://market-search-eta.vercel.app",
    cleartext: false,
  },
};

export default config;
