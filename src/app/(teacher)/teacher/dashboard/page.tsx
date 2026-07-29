import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OumnoLogo } from "@/components/branding/OumnoLogo";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <OumnoLogo size={28} withWordmark />
      <h1 className="text-2xl font-bold">Bonjour {session.user.name}</h1>
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
