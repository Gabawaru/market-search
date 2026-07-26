import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Bonjour {session.user.name}</h1>
      <p className="text-sm text-gray-500">
        Votre espace prof (élèves accompagnés, objectifs, messagerie, rémunération) arrive en
        phase 7.
      </p>
    </main>
  );
}
