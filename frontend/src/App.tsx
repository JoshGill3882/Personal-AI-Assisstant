/**
 * Top-level chat interface wiring specialized components together.
 */

import { useCallback, useState } from "react";

import { ChatHeader } from "./components/ChatHeader";
import { ChatHistory } from "./components/ChatHistory";
import { ChatInput } from "./components/ChatInput";
import { ErrorBanner } from "./components/ErrorBanner";
import { useAssistantChat } from "./hooks/useAssistantChat";
import "./App.css";

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { messages, input, setInput, busy, error, submitPrompt, listUpcoming } = useAssistantChat();

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, [setInput]);

  const toggleTheme = useCallback(
    () => setTheme((cur) => (cur === "light" ? "dark" : "light")),
    []
  );

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="chat-container">
        <ChatHeader theme={theme} onToggleTheme={toggleTheme} />
        <ChatHistory messages={messages} busy={busy} />
        <ChatInput
          value={input}
          busy={busy}
          onChange={handleInputChange}
          onSubmit={submitPrompt}
          onRequestUpcoming={listUpcoming}
        />
        <ErrorBanner message={error} />
      </div>
    </div>
  );
}
