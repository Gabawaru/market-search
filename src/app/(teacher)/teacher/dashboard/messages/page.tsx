import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listThreadsForTeacher } from "@/lib/messaging/threads";

export default async function TeacherMessagesPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const threads = await listThreadsForTeacher(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes discussions</h1>

      {threads.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune discussion pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => {
            const child = thread.participants.find((p) => p.role === "CHILD")?.child;
            const parent = thread.participants.find((p) => p.role === "PARENT")?.parent;
            return (
              <Link
                key={thread.id}
                href={`/teacher/dashboard/messages/${thread.id}`}
                className="rounded-lg border p-3 hover:bg-gray-50"
              >
                {thread.type === "PARENT_TEACHER_PRIVATE"
                  ? `Entretien privé avec ${parent?.name ?? "un parent"}`
                  : `Discussion avec ${child?.name ?? "un enfant"} et ${parent?.name ?? "son parent"}`}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
