import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OumnoLogo } from "@/components/branding/OumnoLogo";
import { listStrugglingChildrenForTeacher } from "@/lib/progression/teacherInsights";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const strugglingChildren = await listStrugglingChildrenForTeacher(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <OumnoLogo size={28} withWordmark />
      <h1 className="text-2xl font-bold">Bonjour {session.user.name}</h1>

      {strugglingChildren.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-lg font-semibold text-amber-900">Élèves qui patinent</h2>
          <p className="text-sm text-amber-800">
            Ces enfants que vous suivez déjà s&apos;entraînent beaucoup sans progresser. Un message
            de votre part peut faire la différence.
          </p>
          <ul className="flex flex-col gap-2">
            {strugglingChildren.map((signal) => (
              <li
                key={`${signal.childId}-${signal.skillId}`}
                className="rounded-md bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium">{signal.childName}</span> — {signal.skillName} (
                {signal.masteryPercent}% de maîtrise)
              </li>
            ))}
          </ul>
          <Link
            href="/teacher/dashboard/messages"
            className="self-start rounded-md bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
          >
            Ouvrir mes discussions
          </Link>
        </section>
      )}

      <Link
        href="/teacher/dashboard/students"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes élèves
      </Link>
      <Link
        href="/teacher/dashboard/messages"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes discussions
      </Link>
      <Link
        href="/teacher/dashboard/tutoring"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Demandes de cours particuliers
      </Link>
      <Link
        href="/teacher/dashboard/availability"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes disponibilités
      </Link>
      <Link
        href="/teacher/dashboard/exercises"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes exercices
      </Link>
      <Link
        href="/teacher/dashboard/lessons"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Leçons
      </Link>
      <Link
        href="/teacher/dashboard/courses"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Cours par classe
      </Link>
      <Link
        href="/teacher/change-password"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Changer le mot de passe
      </Link>
      <Link
        href="/teacher/change-email"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Changer l&apos;email
      </Link>
    </main>
  );
}
