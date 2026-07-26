import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { listThreadsForChild } from "@/lib/messaging/threads";
import { startThreadWithTeacher } from "@/lib/actions/messaging";

export default async function ChildMessagesPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) redirect("/dashboard");

  const [threads, teachers] = await Promise.all([
    listThreadsForChild(childId),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${child.id}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Discussions — {child.name}</h1>

      {threads.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune discussion pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => {
            const teacher = thread.participants.find((p) => p.role === "TEACHER")?.teacher;
            return (
              <Link
                key={thread.id}
                href={`/dashboard/messages/${thread.id}`}
                className="rounded-lg border p-3 hover:bg-gray-50"
              >
                Discussion avec {teacher?.name ?? "un prof"}
              </Link>
            );
          })}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Contacter un prof</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun prof n&apos;est encore inscrit.</p>
        ) : (
          <form action={startThreadWithTeacher} className="flex flex-col gap-3">
            <input type="hidden" name="childId" value={child.id} />
            <select name="teacherId" required className="rounded-md border px-3 py-2">
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="private" />
              Entretien privé (sans {child.name} dans la discussion)
            </label>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            >
              Démarrer la discussion
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
