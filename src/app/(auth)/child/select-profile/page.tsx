import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export default async function SelectChildProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Qui es-tu ?</h1>
        <p className="text-sm text-gray-500">Choisis ton profil pour continuer.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {children.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun profil enfant n&apos;a encore été créé.{" "}
          <Link href="/dashboard/children/new" className="text-indigo-600 underline">
            En créer un
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/child/pin?childId=${child.id}`}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
                {child.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{child.name}</span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/dashboard/children/new" className="text-sm text-indigo-600 underline">
        + Ajouter un enfant
      </Link>

      <Link href="/child/login" className="text-sm text-indigo-600 underline">
        Se connecter directement avec prénom + code secret
      </Link>
    </main>
  );
}
