import { useCallback, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

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

const API_BASE: string = useMemoApiBase();

/** Build API base with default if env is unset */
function useMemoApiBase() {
  return useMemo(() => {
    const env = (import.meta as any).env as { VITE_API_BASE?: string };
    // NOTE: in the browser, "localhost" means the *browser's* machine
    // If your backend runs on the Pi, prefer http://PI_IP:8080
    return env?.VITE_API_BASE?.trim() || "http://localhost:8080";
  }, []);
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          { role: "assistant", content: `⚠️ Error: ${msg}` },
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
        { role: "assistant", content: `⚠️ Error: ${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }, [API_BASE]);

  return (
    <div
      style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui" }}
    >
      <h1>Pi Assistant</h1>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          minHeight: 320,
          background: "#fff",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
            <b>{m.role === "user" ? "You" : "Assistant"}:</b> {m.content}
          </div>
        ))}
        {busy && <div>…thinking…</div>}
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
        <button type="button" onClick={listUpcoming} disabled={busy}>
          Upcoming
        </button>
      </form>

      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>
          <b>Error:</b> {error}
        </p>
      )}

      <small style={{ display: "block", marginTop: 8, opacity: 0.7 }}>
        API: {API_BASE}
      </small>
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
      return detail ? `${status} — ${detail}` : status;
    }
    if (ae.request) return "Network error / API unreachable";
    return ae.message || "Unknown axios error";
  }
  return (err as Error)?.message || "Unknown error";
}
