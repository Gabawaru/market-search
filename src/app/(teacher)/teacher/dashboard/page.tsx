import Link from "next/link";
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
      <Link
        href="/teacher/dashboard/messages"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Mes discussions
      </Link>
      <p className="text-sm text-gray-500">
        Les élèves accompagnés, les objectifs et la rémunération arrivent en phase 7.
      </p>
    </main>
  );
}
