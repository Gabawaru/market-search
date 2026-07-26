import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Oumno Éducation</h1>
        <p className="mt-3 max-w-xl text-lg text-gray-600">
          Apprendre les maths à son rythme, avec des exercices progressifs façon Kumon, un suivi
          honnête de la progression, et des évaluations qui comptent vraiment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/parent/login"
          className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
        >
          Espace parent
        </Link>
        <Link
          href="/child/select-profile"
          className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
        >
          Espace enfant
        </Link>
        <Link
          href="/teacher/login"
          className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
        >
          Espace prof
        </Link>
      </div>

      <p className="text-xs text-gray-400">
        Oumno Éducation est un projet du groupe Oumno, non encore officialisé — usage
        non-commercial jusqu&apos;à officialisation.
      </p>
    </main>
  );
}
