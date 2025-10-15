import { useCallback, useState } from "react";
import axios, { AxiosError } from "axios";
import "./App.css";

type Role = "system" | "user" | "assistant";

type Msg = {
  role: Exclude<Role, "system">; // local chat only stores user/assistant
  content: string;
};

// Payload types matching FastAPI schema
type ChatMessage = { role: Role; content: string };
type ChatRequest = { messages: ChatMessage[] };
type ChatResponse = { reply: string };

type UpcomingResponse = { text: string };

const API_BASE: string = getApiBase();

type Theme = "light" | "dark";

/** Build API base with default if env is unset */
function getApiBase() {
  const env = (import.meta as any).env as { VITE_API_BASE?: string };
  // NOTE: in the browser, "localhost" means the *browser's* machine
  // If your backend runs on the Pi, prefer http://PI_IP:8080
  return env?.VITE_API_BASE?.trim() || "http://localhost:8080";
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("light");

  const send = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || busy) return;

      setError(null);
      setBusy(true);

      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");

      try {
        // Convert local Msg[] to backend ChatMessage[]
        const payload: ChatRequest = {
          messages: next.map((m) => ({
            role: m.role, // 'user' | 'assistant'
            content: m.content,
          })) as ChatMessage[],
        };

        const res = await axios.post<ChatResponse>(
          `${API_BASE}/chat`,
          payload,
          { timeout: 180_000 }
        );

        setMessages((cur) => [
          ...cur,
          { role: "assistant", content: res.data.reply },
        ]);
      } catch (err) {
        const msg = formatAxiosError(err);
        setError(msg);
        setMessages((cur) => [
          ...cur,
          { role: "assistant", content: `[Error] ${msg}` },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [API_BASE, busy, input, messages]
  );

  const listUpcoming = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await axios.get<UpcomingResponse>(
        `${API_BASE}/calendar/upcoming`,
        { params: { days: 7 }, timeout: 60_000 }
      );
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: res.data.text || "No events." },
      ]);
    } catch (err) {
      const msg = formatAxiosError(err);
      setError(msg);
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: `[Error] ${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }, [API_BASE]);

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="chat-container">
        <header className="chat-header">
          <div className="header-content">
            <div className="header-copy">
              <h1>Personal AI Assistant</h1>
              <p>Have a conversation, plan your day, and stay organized.</p>
            </div>
            <button
              className="theme-toggle"
              type="button"
              onClick={() =>
                setTheme((cur) => (cur === "light" ? "dark" : "light"))
              }
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "Dark" : "Light"} mode
            </button>
          </div>
        </header>

        <main className="chat-history">
          {messages.length === 0 && !busy ? (
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

        <form className="chat-input" onSubmit={send}>
          <input
            className="chat-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a prompt to your assistant..."
            autoFocus
          />
          <div className="chat-actions">
            <button
              className="button primary"
              type="submit"
              disabled={busy || !input.trim()}
            >
              Send
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={listUpcoming}
              disabled={busy}
            >
              Upcoming
            </button>
          </div>
        </form>

        {error && (
          <div className="chat-error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <footer className="chat-footer">
          <span>API: {API_BASE}</span>
        </footer>
      </div>
    </div>
  );
}

/** Nicely format axios/network errors */
function formatAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<any>;
    if (ae.response) {
      const status = `${ae.response.status} ${ae.response.statusText}`;
      const detail =
        typeof ae.response.data === "string"
          ? ae.response.data
          : ae.response.data?.detail || "";
      return detail ? `${status} - ${detail}` : status;
    }
    if (ae.request) return "Network error / API unreachable";
    return ae.message || "Unknown axios error";
  }
  return (err as Error)?.message || "Unknown error";
}







