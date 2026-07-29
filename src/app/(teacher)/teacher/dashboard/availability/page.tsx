import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { addTeacherAvailability, removeTeacherAvailability } from "@/lib/actions/tutoring";
import { WEEKDAY_LABELS } from "@/lib/tutoring/weekdays";

export default async function TeacherAvailabilityPage() {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const slots = await prisma.teacherAvailability.findMany({
    where: { teacherId: session.user.id },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold">Mes disponibilités</h1>
      <p className="text-sm text-gray-500">
        Ces créneaux sont visibles par les parents avant qu&apos;ils vous envoient une demande de
        cours particulier.
      </p>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun créneau renseigné pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>
                {WEEKDAY_LABELS[slot.weekday]} {slot.startTime}–{slot.endTime}
              </span>
              <form action={removeTeacherAvailability}>
                <input type="hidden" name="id" value={slot.id} />
                <button type="submit" className="text-red-600 underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Ajouter un créneau</h2>
        <form action={addTeacherAvailability} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Jour
            <select name="weekday" required className="rounded-md border px-3 py-2">
              {WEEKDAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Heure de début
            <input type="time" name="startTime" required className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Heure de fin
            <input type="time" name="endTime" required className="rounded-md border px-3 py-2" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            Ajouter
          </button>
        </form>
      </section>
    </main>
  );
}
