import Link from "next/link";
import { applyAsTeacher } from "@/lib/actions/auth";

export default async function TeacherApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Devenir prof sur Oumno Éducation</h1>
        <p className="text-sm text-gray-500">
          Un compte prof n&apos;est pas créé directement : votre candidature est transmise à la
          direction du site, qui vous enverra des identifiants pour vous connecter et choisir
          votre mot de passe.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Votre candidature a bien été envoyée. Vous recevrez vos identifiants de connexion une
          fois validée.
        </p>
      )}

      {!success && (
        <form action={applyAsTeacher} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Votre nom
            <input type="text" name="name" required className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input type="email" name="email" required className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Message (présentez-vous, votre expérience, etc.)
            <textarea name="message" rows={4} className="rounded-md border px-3 py-2" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            Envoyer ma candidature
          </button>
        </form>
      )}

      <p className="text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/teacher/login" className="text-emerald-600 underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
