import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// Recouvre toutes les pages /teacher/dashboard/** (mais pas /teacher/change-password, qui vit
// hors de ce groupe de routes pour éviter une boucle de redirection).
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { id: session.user.id } });
    if (teacher?.mustChangePassword) {
      redirect("/teacher/change-password");
    }
  }
  return children;
}
