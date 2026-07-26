import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isThreadParticipant, listMessages } from "@/lib/messaging/threads";
import { sendParentMessage } from "@/lib/actions/messaging";
import { ChatThreadView } from "@/components/messaging/ChatThreadView";

export default async function ParentThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const allowed = await isThreadParticipant(threadId, "PARENT", session.user.id);
  if (!allowed) redirect("/dashboard");

  const messages = await listMessages(threadId);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/dashboard" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <ChatThreadView
        threadId={threadId}
        messages={messages}
        currentRole="PARENT"
        sendAction={sendParentMessage}
      />
    </main>
  );
}
