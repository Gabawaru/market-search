import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { logoutChild } from "@/lib/actions/auth";

export default async function ChildHomePage() {
  const childSession = await getChildSession();
  if (!childSession) {
    redirect("/child/select-profile");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salut {childSession.name} !</h1>
        <form action={logoutChild}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Changer de profil
          </button>
        </form>
      </div>
      <Link
        href="/app/practice"
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        S&apos;entraîner
      </Link>

      <p className="text-sm text-gray-500">
        Les évaluations arrivent dans une prochaine phase.
      </p>
    </main>
  );
}
