import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { changeTeacherEmail } from "@/lib/actions/auth";

export default async function TeacherChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: session.user.id } });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Changer l&apos;adresse email</h1>
        <p className="text-sm text-gray-500">
          Adresse actuelle : {teacher?.email}. Entrez votre mot de passe actuel puis la nouvelle
          adresse.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={changeTeacherEmail} className="flex flex-col gap-4">
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
          <input type="email" name="newEmail" required className="rounded-md border px-3 py-2" />
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
