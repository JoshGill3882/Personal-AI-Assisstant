/**
 * Scrollable area rendering the chat transcript and busy indicator.
 */

import type { Msg } from "../types/chat";

type ChatHistoryProps = {
  messages: Msg[];
  busy: boolean;
};

export function ChatHistory({ messages, busy }: ChatHistoryProps) {
  const showEmptyState = messages.length === 0 && !busy;

  return (
    <main className="chat-history">
      {showEmptyState ? (
        <div className="chat-empty">
          <h2>Start a conversation</h2>
          <p>Send a prompt below to begin chatting with your assistant.</p>
        </div>
      ) : null}

      {messages.map((m, i) => (
        <div key={i} className={`chat-message ${m.role}`}>
          <span className="badge">{m.role === "user" ? "You" : "AI"}</span>
          <div className="bubble">{m.content}</div>
        </div>
      ))}

      {busy && (
        <div className="chat-status">
          <span className="dot-pulse" aria-hidden="true"></span>
          <span>Assistant is thinking...</span>
        </div>
      )}
    </main>
  );
}
