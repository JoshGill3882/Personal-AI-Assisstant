/**
 * Branded header area housing the assistant title and theme toggle.
 */

type ChatHeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function ChatHeader({ theme, onToggleTheme }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="header-content">
        <div className="header-copy">
          <h1>Personal AI Assistant</h1>
          <p>Have a conversation, plan your day, and stay organized.</p>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "Dark" : "Light"} mode
        </button>
      </div>
    </header>
  );
}
