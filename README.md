# Oumno Éducation

Plateforme web d'apprentissage des mathématiques pour enfants, inspirée de Kumon : exercices
progressifs, évaluations à contrôle anti-triche strict, suivi parental, système de points,
messagerie enfant/prof/parent et marketplace de cours particuliers.

Statut : projet en développement, usage non-commercial (marque "Oumno Éducation" non
officialisée).

## Stack

- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma (adaptateur `@prisma/adapter-pg`)
- NextAuth (Auth.js) pour les comptes parent/prof, session PIN dédiée pour les enfants

## Démarrer en local

1. Avoir PostgreSQL disponible localement (voir `docker-compose.yml`, ou un service local).
2. Copier `.env.example` en `.env` et ajuster `DATABASE_URL` + secrets.
3. Installer les dépendances et préparer la base :

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Scripts utiles

- `npm run dev` — serveur de développement
- `npm run build` / `npm start` — build et lancement production
- `npm run lint` — ESLint
- `npm test` — tests unitaires (Vitest)
- `npm run db:migrate` — migrations Prisma
- `npm run db:studio` — explorateur de données Prisma Studio

## Documentation

Le plan produit et l'architecture détaillée sont décrits séparément (comptes, cœur Kumon,
anti-triche, points, messagerie, marketplace de profs, scan IA automatisé, espace développeur).
