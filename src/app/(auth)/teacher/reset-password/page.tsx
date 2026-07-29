import { resetTeacherPassword } from "@/lib/actions/auth";

export default async function TeacherResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Choisir un nouveau mot de passe</h1>
        <p className="text-sm text-gray-500">
          Ce lien est valable une heure et ne fonctionne qu&apos;une seule fois.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {token ? (
        <form action={resetTeacherPassword} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <label className="flex flex-col gap-1 text-sm">
            Nouveau mot de passe
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            Valider
          </button>
        </form>
      ) : (
        <p className="text-sm text-red-700">Lien de réinitialisation manquant ou invalide.</p>
      )}
    </main>
  );
}
