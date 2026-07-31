import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { listChildIdsVisibleToTeacher } from "@/lib/progression/teacherInsights";

export default async function TeacherStudentsPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const [ownStudents, otherVisibleIds] = await Promise.all([
    prisma.child.findMany({
      where: { teacherId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
    listChildIdsVisibleToTeacher(session.user.id),
  ]);

  const otherStudents = await prisma.child.findMany({
    where: { id: { in: otherVisibleIds.filter((id) => !ownStudents.some((c) => c.id === id)) } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes élèves</h1>

      <Link
        href="/teacher/dashboard/students/new"
        className="self-start rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
      >
        + Ajouter un élève
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Élèves que vous avez créés</h2>
        {ownStudents.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun élève créé pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ownStudents.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/teacher/dashboard/students/${child.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm text-gray-500">{child.gradeLevel ?? "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {otherStudents.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Élèves suivis (cours particuliers / discussion)</h2>
          <ul className="flex flex-col gap-2">
            {otherStudents.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/teacher/dashboard/students/${child.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm text-gray-500">{child.gradeLevel ?? "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
