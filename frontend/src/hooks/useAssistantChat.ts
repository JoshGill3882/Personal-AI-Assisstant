/**
 * Centralised chat state management for the assistant UI.
 */

import { useCallback, useState } from "react";

import { api } from "../lib/http";
import { formatAxiosError } from "../lib/errors";
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  Msg,
  UpcomingResponse,
} from "../types/chat";

const CHAT_TIMEOUT = 180_000;
const UPCOMING_TIMEOUT = 60_000;

export function useAssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPrompt = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    setError(null);
    setBusy(true);

    const userMsg: Msg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    try {
      const payload: ChatRequest = {
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ChatMessage[],
      };

      const res = await api.post<ChatResponse>("/chat", payload, {
        timeout: CHAT_TIMEOUT,
      });

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
  }, [busy, input, messages]);

  const listUpcoming = useCallback(async () => {
    if (busy) return;

    setError(null);
    setBusy(true);
    try {
      const res = await api.get<UpcomingResponse>("/calendar/upcoming", {
        params: { days: 7 },
        timeout: UPCOMING_TIMEOUT,
      });

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
  }, [busy]);

  return {
    messages,
    input,
    setInput,
    busy,
    error,
    clearError: () => setError(null),
    submitPrompt,
    listUpcoming,
  };
}
