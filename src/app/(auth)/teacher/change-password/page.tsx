import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changeTeacherPassword } from "@/lib/actions/auth";

export default async function TeacherChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Choisissez votre mot de passe</h1>
        <p className="text-sm text-gray-500">
          Votre compte a été créé avec un mot de passe temporaire — définissez le vôtre avant de
          continuer.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={changeTeacherPassword} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nouveau mot de passe
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
          className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          Valider
        </button>
      </form>
    </main>
  );
}
