import Link from "next/link";
import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { isThreadParticipant, listMessages } from "@/lib/messaging/threads";
import { sendChildMessage } from "@/lib/actions/messaging";
import { ChatThreadView } from "@/components/messaging/ChatThreadView";

export default async function ChildThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const allowed = await isThreadParticipant(threadId, "CHILD", session.childId);
  if (!allowed) redirect("/app/messages");

  const messages = await listMessages(threadId);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <Link href="/app/messages" className="text-sm text-indigo-600 underline">
        ← Retour
      </Link>
      <ChatThreadView
        threadId={threadId}
        messages={messages}
        currentRole="CHILD"
        sendAction={sendChildMessage}
      />
    </main>
  );
}
