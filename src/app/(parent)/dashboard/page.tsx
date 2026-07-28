import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { logoutParent } from "@/lib/actions/auth";
import { OumnoLogo } from "@/components/branding/OumnoLogo";

export default async function ParentDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <OumnoLogo size={28} withWordmark />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bonjour {session.user.name}</h1>
          <p className="text-sm text-gray-500">Voici la progression de vos enfants.</p>
        </div>
        <form action={logoutParent}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Se déconnecter
          </button>
        </form>
      </div>

      {children.length === 0 ? (
        <p className="text-sm text-gray-500">Vous n&apos;avez pas encore ajouté d&apos;enfant.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/dashboard/${child.id}`}
              className="rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="font-semibold">{child.name}</div>
              <div className="text-sm text-gray-500">Voir la progression</div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard/children/new" className="text-indigo-600 underline">
          + Ajouter un enfant
        </Link>
        <Link href="/child/select-profile" className="text-indigo-600 underline">
          Passer sur le profil d&apos;un enfant
        </Link>
        <Link href="/dashboard/change-password" className="text-indigo-600 underline">
          Changer le mot de passe
        </Link>
      </div>
    </main>
  );
}
