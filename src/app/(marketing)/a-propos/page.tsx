import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "À propos — Oumno Éducation",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-indigo-600 underline">
        ← Accueil
      </Link>
      <h1 className="text-3xl font-bold">À propos d&apos;Oumno Éducation</h1>

      <p className="text-gray-700">
        Oumno Éducation est une plateforme d&apos;apprentissage des mathématiques pour enfants,
        inspirée de la méthode Kumon : des exercices progressifs, un suivi honnête de la
        progression, et des évaluations à contrôle strict pour que la réussite ait vraiment un
        sens.
      </p>

      <h2 className="text-xl font-semibold">Statut du projet</h2>
      <p className="text-gray-700">
        Oumno Éducation est un projet du groupe Oumno, actuellement <strong>non officialisé</strong>.
        Son usage est <strong>non-commercial</strong> jusqu&apos;à officialisation. Aucun paiement réel
        n&apos;est traité sur la plateforme : les montants affichés pour les cours particuliers sont
        simulés, à titre indicatif pour les parents et les profs.
      </p>

      <figure className="overflow-hidden rounded-xl border">
        <Image
          src="/images/enfant-cahier.jpg"
          alt="Enfant concentré qui écrit dans un cahier"
          width={1400}
          height={1867}
          className="h-72 w-full object-cover"
        />
        <figcaption className="px-4 py-2 text-xs text-gray-400">
          Photo : Shixart1985 — Wikimedia Commons (CC BY 2.0)
        </figcaption>
      </figure>

      <h2 className="text-xl font-semibold">Comment ça marche</h2>
      <ul className="list-disc space-y-2 pl-5 text-gray-700">
        <li>
          Les enfants s&apos;entraînent librement par compétence, à leur rythme, avec des exercices
          générés à la demande.
        </li>
        <li>
          Une fois prêts, ils passent une évaluation en conditions strictes (plein écran, pas de
          changement d&apos;onglet, pas de copier-coller) pour débloquer le niveau suivant.
        </li>
        <li>
          Les parents suivent la progression, les résultats et l&apos;intégrité des évaluations
          depuis leur tableau de bord.
        </li>
        <li>
          Un accompagnement par un prof particulier peut être demandé, avec un objectif de note
          clair sur une période donnée.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Pas que de l&apos;IA</h2>
      <p className="text-gray-700">
        L&apos;entraînement quotidien s&apos;appuie sur des exercices générés automatiquement, pour
        une pratique illimitée et gratuite. Mais dès qu&apos;un enfant a besoin d&apos;autre chose,
        il y a toujours un vrai humain derrière :
      </p>
      <ul className="list-disc space-y-2 pl-5 text-gray-700">
        <li>
          Des <strong>exercices écrits par de vrais profs</strong>, jamais notés automatiquement —
          chaque réponse est corrigée à la main, avec un retour personnalisé.
        </li>
        <li>
          Une <strong>assistance IA</strong> pour proposer chaque jour un exercice adapté au niveau
          de l&apos;enfant — un point de départ, pas un jugement final.
        </li>
        <li>
          Et si un enfant reste bloqué malgré tout, la possibilité d&apos;engager un{" "}
          <strong>vrai prof particulier</strong> pour un accompagnement dédié.
        </li>
      </ul>

      <p className="text-sm text-gray-400">
        Une question, une remarque ? Utilisez la boîte à suggestions depuis l&apos;espace parent ou
        enfant.
      </p>
    </main>
  );
}
