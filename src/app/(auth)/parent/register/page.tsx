import Link from "next/link";
import { registerParent } from "@/lib/actions/auth";

export default async function ParentRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Créer un compte parent</h1>
        <p className="text-sm text-gray-500">
          Vous pourrez ensuite ajouter le profil de vos enfants. Un email ou un identifiant
          suffit — vous pourrez ajouter l&apos;autre plus tard depuis votre tableau de bord.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={registerParent} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Votre nom
          <input type="text" name="name" required className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email (optionnel si vous choisissez un identifiant)
          <input type="email" name="email" className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Identifiant (optionnel si vous renseignez un email)
          <input type="text" name="username" className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Créer mon compte
        </button>
      </form>

      <p className="text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/parent/login" className="text-indigo-600 underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
