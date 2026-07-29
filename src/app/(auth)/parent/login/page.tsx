import Link from "next/link";
import { loginParent } from "@/lib/actions/auth";

export default async function ParentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Espace parent</h1>
        <p className="text-sm text-gray-500">Connectez-vous pour suivre vos enfants.</p>
      </div>

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Mot de passe mis à jour, vous pouvez vous connecter.
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={loginParent} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email ou identifiant
          <input
            type="text"
            name="identifier"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            name="password"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Se connecter
        </button>
      </form>

      <p className="text-sm text-gray-500">
        <Link href="/parent/forgot-password" className="text-indigo-600 underline">
          Mot de passe oublié ?
        </Link>
      </p>

      <p className="text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/parent/register" className="text-indigo-600 underline">
          Créer un compte parent
        </Link>
      </p>
    </main>
  );
}
