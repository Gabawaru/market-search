interface ChatMessageItem {
  id: string;
  senderRole: string;
  body: string;
  createdAt: Date;
}

export function ChatThreadView({
  threadId,
  messages,
  currentRole,
  sendAction,
}: {
  threadId: string;
  messages: ChatMessageItem[];
  currentRole: "PARENT" | "CHILD" | "TEACHER";
  sendAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun message pour l&apos;instant.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.senderRole === currentRole ? "self-end bg-indigo-100" : "self-start bg-gray-100"
              }`}
            >
              <div className="text-xs text-gray-400">{m.senderRole}</div>
              <div>{m.body}</div>
            </div>
          ))
        )}
      </div>
      <form action={sendAction} className="flex gap-2">
        <input type="hidden" name="threadId" value={threadId} />
        <input
          type="text"
          name="body"
          required
          placeholder="Écrire un message..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
