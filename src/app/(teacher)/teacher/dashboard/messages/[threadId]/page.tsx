import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isThreadParticipant, listMessages } from "@/lib/messaging/threads";
import { sendTeacherMessage } from "@/lib/actions/messaging";
import { ChatThreadView } from "@/components/messaging/ChatThreadView";

export default async function TeacherThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const allowed = await isThreadParticipant(threadId, "TEACHER", session.user.id);
  if (!allowed) redirect("/teacher/dashboard/messages");

  const messages = await listMessages(threadId);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/teacher/dashboard/messages" className="text-sm text-emerald-600 underline">
        ← Retour
      </Link>
      <ChatThreadView
        threadId={threadId}
        messages={messages}
        currentRole="TEACHER"
        sendAction={sendTeacherMessage}
      />
    </main>
  );
}
