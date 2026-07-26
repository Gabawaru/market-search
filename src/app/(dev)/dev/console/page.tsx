import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export default async function DevConsolePage() {
  const session = await auth();
  if (session?.user.role !== "DEV_ADMIN") {
    redirect("/dev/login");
  }

  const pendingSuggestions = await prisma.devSuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Espace développeur</h1>
      <p className="text-sm text-gray-500">
        Suggestions générées par le scan IA, en attente de validation.
      </p>
      {pendingSuggestions.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucune suggestion en attente pour l&apos;instant — le scan IA automatisé arrive en phase
          8.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendingSuggestions.map((s) => (
            <li key={s.id} className="rounded-lg border p-3">
              <div className="text-xs uppercase text-gray-400">{s.category}</div>
              <div className="font-medium">{s.title}</div>
              <p className="text-sm text-gray-600">{s.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
