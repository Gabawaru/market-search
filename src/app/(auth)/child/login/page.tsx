import Link from "next/link";
import { loginChildByNamePin } from "@/lib/actions/auth";

export default async function ChildDirectLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Espace enfant</h1>
        <p className="text-sm text-gray-500">Entre ton prénom et ton code secret.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={loginChildByNamePin} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Prénom
          <input type="text" name="name" required autoFocus className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Code secret
          <input
            type="password"
            inputMode="numeric"
            name="pin"
            required
            maxLength={6}
            className="rounded-md border px-3 py-2 text-center text-2xl tracking-[0.5em]"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          C&apos;est parti !
        </button>
      </form>

      <p className="text-sm text-gray-500">
        Un parent est déjà connecté sur cet appareil ?{" "}
        <Link href="/child/select-profile" className="text-indigo-600 underline">
          Choisir mon profil
        </Link>
      </p>
    </main>
  );
}
