import Link from "next/link";
import { requestTeacherPasswordReset } from "@/lib/actions/auth";

export default async function TeacherForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="text-sm text-gray-500">Entrez l&apos;email associé à votre compte prof.</p>
      </div>

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Si un compte existe avec cet email, un lien de réinitialisation vient de lui être
          envoyé.
        </p>
      )}

      <form action={requestTeacherPasswordReset} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" name="email" required className="rounded-md border px-3 py-2" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          Envoyer le lien de réinitialisation
        </button>
      </form>

      <p className="text-sm text-gray-500">
        <Link href="/teacher/login" className="text-emerald-600 underline">
          ← Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
