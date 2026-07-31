import {
  contentOriginIcon,
  contentOriginLabel,
  type ContentOrigin,
} from "@/lib/content/contentOrigin";

const STYLES: Record<ContentOrigin, string> = {
  generated: "border-gray-200 bg-gray-50 text-gray-500",
  teacher: "border-emerald-200 bg-emerald-50 text-emerald-700",
  curated: "border-sky-200 bg-sky-50 text-sky-700",
};

export function ContentOriginBadge({
  origin,
  authorName,
  className = "",
}: {
  origin: ContentOrigin;
  authorName?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[origin]} ${className}`}
    >
      <span aria-hidden="true">{contentOriginIcon(origin)}</span>
      {contentOriginLabel(origin, authorName)}
    </span>
  );
}
