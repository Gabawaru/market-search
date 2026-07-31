import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { GRADE_LEVELS } from "@/lib/validation/schemas";
import { listChildIdsVisibleToTeacher } from "@/lib/progression/teacherInsights";
import { requestCurationBatch } from "@/lib/actions/lessons";

const UNCLASSIFIED = "__none__";

function countByGrade(rows: { gradeLevel: string | null }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row.gradeLevel ?? UNCLASSIFIED;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export default async function TeacherCoursesByClassPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const visibleIds = await listChildIdsVisibleToTeacher(session.user.id);

  const [lessons, curated, teacherExercises, children] = await Promise.all([
    prisma.lesson.findMany({ select: { gradeLevel: true } }),
    prisma.curatedExercise.findMany({ where: { status: "APPROVED" }, select: { gradeLevel: true } }),
    prisma.teacherExercise.findMany({ where: { status: "PUBLISHED" }, select: { gradeLevel: true } }),
    prisma.child.findMany({
      where: { OR: [{ teacherId: session.user.id }, { id: { in: visibleIds } }] },
      select: { gradeLevel: true },
    }),
  ]);

  const lessonsByGrade = countByGrade(lessons);
  const curatedByGrade = countByGrade(curated);
  const teacherExByGrade = countByGrade(teacherExercises);
  const studentsByGrade = countByGrade(children);

  const rows = [...GRADE_LEVELS, UNCLASSIFIED].map((grade) => {
    const label = grade === UNCLASSIFIED ? "Non classé" : grade;
    const lessonsCount = lessonsByGrade.get(grade) ?? 0;
    const exercisesCount = (curatedByGrade.get(grade) ?? 0) + (teacherExByGrade.get(grade) ?? 0);
    const studentsCount = studentsByGrade.get(grade) ?? 0;
    // Lacune : aucune leçon OU aucun exercice pour une classe où il y a au moins un élève.
    const hasGap = studentsCount > 0 && (lessonsCount === 0 || exercisesCount === 0);
    return { grade, label, lessonsCount, exercisesCount, studentsCount, hasGap };
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Cours par classe</h1>
      <p className="text-sm text-gray-500">
        Pour chaque classe : combien d&apos;élèves vous suivez et combien de contenu existe. Les
        classes qui ont des élèves mais peu de contenu sont signalées « à compléter ».
      </p>

      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.grade}
            className={`rounded-lg border p-3 ${row.hasGap ? "border-amber-300 bg-amber-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{row.label}</span>
              <span className="text-sm text-gray-500">
                {row.studentsCount} élève{row.studentsCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {row.lessonsCount} leçon{row.lessonsCount > 1 ? "s" : ""} · {row.exercisesCount}{" "}
              exercice{row.exercisesCount > 1 ? "s" : ""}
            </div>
            {row.hasGap && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-sm text-amber-800">
                  À compléter — des élèves sont dans cette classe mais il manque du contenu.
                </p>
                {row.grade !== UNCLASSIFIED && (
                  <form action={requestCurationBatch}>
                    <input
                      type="hidden"
                      name="note"
                      value={`Classe ${row.label} : il manque des exercices/leçons pour les élèves de ce niveau.`}
                    />
                    <input type="hidden" name="returnTo" value="/teacher/dashboard/courses" />
                    <button
                      type="submit"
                      className="self-start rounded-md bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
                    >
                      Demander une curation pour {row.label}
                    </button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
