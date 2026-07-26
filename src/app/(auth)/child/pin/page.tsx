import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { loginChild } from "@/lib/actions/auth";

export default async function ChildPinPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string; error?: string }>;
}) {
  const { childId, error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }
  if (!childId) {
    redirect("/child/select-profile");
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) {
    redirect("/child/select-profile");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
          {child.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">Salut {child.name} !</h1>
        <p className="text-sm text-gray-500">Entre ton code secret.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={loginChild} className="flex flex-col gap-4">
        <input type="hidden" name="childId" value={child.id} />
        <input
          type="password"
          inputMode="numeric"
          name="pin"
          autoFocus
          required
          maxLength={6}
          className="rounded-md border px-3 py-2 text-center text-2xl tracking-[0.5em]"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
        >
          C&apos;est parti !
        </button>
      </form>
    </main>
  );
}
