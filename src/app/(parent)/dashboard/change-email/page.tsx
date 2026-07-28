import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changeParentEmail } from "@/lib/actions/auth";

export default async function ParentChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <Link href="/dashboard" className="text-sm text-indigo-600 underline">
          ← Retour
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Changer l&apos;adresse email</h1>
        <p className="text-sm text-gray-500">
          Entrez votre mot de passe actuel puis la nouvelle adresse email.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={changeParentEmail} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe actuel
          <input
            type="password"
            name="currentPassword"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nouvelle adresse email
          <input
            type="email"
            name="newEmail"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Valider
        </button>
      </form>
    </main>
  );
}
