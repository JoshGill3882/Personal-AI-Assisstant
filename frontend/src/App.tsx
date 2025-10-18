/**
 * Top-level chat interface for the Personal AI Assistant frontend.
 * Handles message state, LLM calls, and calendar helper actions.
 */

import { useCallback, useState } from "react";
import axios, { AxiosError } from "axios";
import "./App.css";

// Ensure cookies / auth headers accompany every request to the backend.
axios.defaults.withCredentials = true;

type Role = "system" | "user" | "assistant";

type Msg = {
  // Local conversation only ever stores user and assistant messages.
  role: Exclude<Role, "system">;
  content: string;
};

// Payload types mirroring the FastAPI schema.
type ChatMessage = { role: Role; content: string };
type ChatRequest = { messages: ChatMessage[] };
type ChatResponse = { reply: string };
type UpcomingResponse = { text: string };

const API_BASE: string = getApiBase();

type Theme = "light" | "dark";
type Env = {
  VITE_API_BASE?: string;
};

/** Build API base with default if env is unset. */
function getApiBase() {
  const env = (import.meta as any).env as Env;
  const configured = env?.VITE_API_BASE?.trim();
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const needsPort = hostname === "localhost" || hostname === "127.0.0.1";
    const port = needsPort ? ":8080" : "";
    return `${protocol}//${hostname}${port}`;
  }

  return "http://localhost:8080";
}

export default function App() {
  // Conversation history displayed in the chat window.
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Theme toggle purely affects CSS class name.
  const [theme, setTheme] = useState<Theme>("dark");

  const send = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || busy) return;

      setError(null);
      setBusy(true);

      // Store the user message locally before calling the backend.
      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");

      try {
        // Convert local Msg[] to backend ChatMessage[].
        const payload: ChatRequest = {
          messages: next.map((m) => ({
            role: m.role,
            content: m.content,
          })) as ChatMessage[],
        };

        const res = await axios.post<ChatResponse>(
          `${API_BASE}/chat`,
          payload,
          { timeout: 180_000, withCredentials: true }
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
        { params: { days: 7 }, timeout: 60_000, withCredentials: true }
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
      </div>
    </div>
  );
}

/** Nicely format axios/network errors for display. */
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
