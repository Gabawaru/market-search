import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { listThreadsForChild } from "@/lib/messaging/threads";

export default async function ChildMessagesPage() {
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const threads = await listThreadsForChild(session.childId);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes discussions</h1>

      {threads.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucune discussion pour l&apos;instant — elle apparaîtra ici dès qu&apos;un prof accompagne
          tes parents.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => {
            const teacher = thread.participants.find((p) => p.role === "TEACHER")?.teacher;
            return (
              <Link
                key={thread.id}
                href={`/app/messages/${thread.id}`}
                className="rounded-lg border p-3 hover:bg-gray-50"
              >
                Discussion avec {teacher?.name ?? "un prof"}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
