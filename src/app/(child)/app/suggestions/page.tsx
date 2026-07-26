import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { getOrCreateSuggestionThreadForChild, listSuggestionMessages } from "@/lib/messaging/suggestions";
import { postChildSuggestion } from "@/lib/actions/messaging";

export default async function ChildSuggestionsPage() {
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const thread = await getOrCreateSuggestionThreadForChild(session.childId);
  const messages = await listSuggestionMessages(thread.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/app" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes idées et suggestions</h1>
      <p className="text-sm text-gray-500">
        Une idée pour améliorer le site ? Une envie particulière ? Écris-la ici, tes parents la
        verront aussi.
      </p>

      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de suggestion.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.authorRole === "CHILD" ? "self-end bg-indigo-100" : "self-start bg-gray-100"
              }`}
            >
              <div className="text-xs text-gray-400">{m.authorRole === "CHILD" ? "Toi" : "Parent"}</div>
              <div>{m.body}</div>
            </div>
          ))
        )}
      </div>

      <form action={postChildSuggestion} className="flex gap-2">
        <input
          type="text"
          name="body"
          required
          placeholder="Ton idée..."
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
