import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createChildProfile } from "@/lib/actions/auth";
import { GRADE_LEVELS } from "@/lib/validation/schemas";

export default async function NewChildPage({
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
        <h1 className="text-2xl font-bold">Ajouter un enfant</h1>
        <p className="text-sm text-gray-500">
          Le code PIN lui servira à se connecter à son profil.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={createChildProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Prénom
          <input type="text" name="name" required className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Année de naissance
          <input
            type="number"
            name="birthYear"
            required
            min={1990}
            max={new Date().getFullYear()}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Classe
          <select name="gradeLevel" required className="rounded-md border px-3 py-2">
            {GRADE_LEVELS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Code PIN (4 à 6 chiffres)
          <input
            type="password"
            inputMode="numeric"
            name="pin"
            required
            minLength={4}
            maxLength={6}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          Créer le profil
        </button>
      </form>
    </main>
  );
}
