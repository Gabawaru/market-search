import Link from "next/link";
import { loginTeacher } from "@/lib/actions/auth";

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Espace prof</h1>
        <p className="text-sm text-gray-500">Connectez-vous à votre espace enseignant.</p>
      </div>

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Mot de passe mis à jour, vous pouvez vous connecter.
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={loginTeacher} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email ou identifiant
          <input type="text" name="identifier" required className="rounded-md border px-3 py-2" />
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
          className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          Se connecter
        </button>
      </form>

      <p className="text-sm text-gray-500">
        <Link href="/teacher/forgot-password" className="text-emerald-600 underline">
          Mot de passe oublié ?
        </Link>
      </p>

      <p className="text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/teacher/apply" className="text-emerald-600 underline">
          Envoyer une candidature
        </Link>
      </p>
    </main>
  );
}
