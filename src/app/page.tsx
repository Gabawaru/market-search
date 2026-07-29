import Link from "next/link";
import Image from "next/image";
import { OumnoLogo } from "@/components/branding/OumnoLogo";
import { IntroAnimation } from "@/components/IntroAnimation";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <IntroAnimation />
      <OumnoLogo size={36} withWordmark />

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- petit SVG statique */}
        <img src="/mascot.svg" alt="Oumi, la mascotte d'Oumno Éducation" className="h-32 w-auto shrink-0" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Oumno Éducation</h1>
          <p className="mt-3 max-w-xl text-lg text-gray-600">
            Apprendre les maths à son rythme, avec des exercices progressifs façon Kumon, un suivi
            honnête de la progression, et des évaluations qui comptent vraiment.
          </p>
        </div>
      </div>

      <figure className="overflow-hidden rounded-xl border">
        <Image
          src="/images/enfant-calcul.jpg"
          alt="Cahier de mathématiques et mains qui comptent sur les doigts"
          width={1400}
          height={933}
          className="h-64 w-full object-cover"
          priority
        />
        <figcaption className="px-4 py-2 text-xs text-gray-400">
          Photo : Jeuwre — Wikimedia Commons (CC BY-SA 4.0)
        </figcaption>
      </figure>

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
        non-commercial jusqu&apos;à officialisation.{" "}
        <Link href="/a-propos" className="underline">
          En savoir plus
        </Link>
      </p>
    </main>
  );
}
