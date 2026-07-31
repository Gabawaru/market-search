import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Documents réels (photo/scan de fiche, PDF) joints aux exercices de prof — le défaut
      // (1 Mo) est trop petit pour une photo de cahier.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
