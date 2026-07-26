import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateSuggestionThreadForChild, listSuggestionMessages } from "@/lib/messaging/suggestions";
import { postParentSuggestion } from "@/lib/actions/messaging";

export default async function ParentSuggestionsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) redirect("/dashboard");

  const thread = await getOrCreateSuggestionThreadForChild(childId);
  const messages = await listSuggestionMessages(thread.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href={`/dashboard/${child.id}`} className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Idées et suggestions — {child.name}</h1>

      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de suggestion.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.authorRole === "PARENT" ? "self-end bg-indigo-100" : "self-start bg-gray-100"
              }`}
            >
              <div className="text-xs text-gray-400">
                {m.authorRole === "PARENT" ? "Vous" : child.name}
              </div>
              <div>{m.body}</div>
            </div>
          ))
        )}
      </div>

      <form action={postParentSuggestion} className="flex gap-2">
        <input type="hidden" name="childId" value={child.id} />
        <input
          type="text"
          name="body"
          required
          placeholder="Votre idée..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Envoyer
        </button>
      </form>
    </main>
  );
}
