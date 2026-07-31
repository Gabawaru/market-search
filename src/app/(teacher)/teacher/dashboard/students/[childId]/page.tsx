import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { canTeacherAccessChild } from "@/lib/progression/teacherInsights";
import { updateChildGradeLevel } from "@/lib/actions/auth";
import { GRADE_LEVELS } from "@/lib/validation/schemas";

export default async function TeacherStudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { childId } = await params;
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  if (!(await canTeacherAccessChild(session.user.id, childId))) {
    redirect("/teacher/dashboard/students");
  }

  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });

  const [skillProgress, streak, badges, wallet] = await Promise.all([
    prisma.childSkillProgress.findMany({
      where: { childId },
      include: { skill: true },
      orderBy: { skill: { order: "asc" } },
    }),
    prisma.streak.findUnique({ where: { childId } }),
    prisma.childBadge.count({ where: { childId } }),
    prisma.pointsWallet.findUnique({ where: { childId } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard/students" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">{child.name}</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={updateChildGradeLevel} className="flex items-center gap-2 text-sm">
        <input type="hidden" name="childId" value={child.id} />
        <input type="hidden" name="returnTo" value={`/teacher/dashboard/students/${child.id}`} />
        <label htmlFor="gradeLevel" className="text-gray-500">
          Classe
        </label>
        <select
          id="gradeLevel"
          name="gradeLevel"
          defaultValue={child.gradeLevel ?? ""}
          className="rounded-md border px-2 py-1"
        >
          {!child.gradeLevel && <option value="">—</option>}
          {GRADE_LEVELS.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border px-2 py-1 hover:bg-gray-50">
          Enregistrer
        </button>
      </form>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-indigo-600">{wallet?.balance ?? 0}</div>
          <div className="text-xs text-gray-500">points</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{streak?.currentStreak ?? 0}🔥</div>
          <div className="text-xs text-gray-500">jours de suite</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-xl font-bold text-emerald-600">{badges}</div>
          <div className="text-xs text-gray-500">badges</div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Progression par compétence</h2>
        {skillProgress.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de pratique enregistrée.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {skillProgress.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.skill.name}</span>
                  <span className="text-gray-500">{Math.round(p.masteryScore * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.round(p.masteryScore * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href={`/teacher/dashboard/students/${child.id}/integrity`}
        className="rounded-lg border p-4 text-center font-medium hover:bg-gray-50"
      >
        Journal d&apos;intégrité et d&apos;assiduité
      </Link>
    </main>
  );
}
