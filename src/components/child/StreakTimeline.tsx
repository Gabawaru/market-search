import type { StreakDay } from "@/lib/progression/streakTimeline";

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export function StreakTimeline({ days }: { days: StreakDay[] }) {
  return (
    <div className="flex justify-between gap-1 rounded-lg border p-3">
      {days.map((day) => {
        const isToday = day.date.toDateString() === new Date().toDateString();
        return (
          <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{WEEKDAY_LABELS[day.date.getDay()]}</span>
            <div
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs " +
                (day.active
                  ? "bg-orange-500 text-white"
                  : isToday
                    ? "border-2 border-dashed border-indigo-400 text-gray-400"
                    : "bg-gray-100 text-gray-400")
              }
              title={day.date.toLocaleDateString("fr-FR")}
            >
              {day.active ? "🔥" : day.date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
