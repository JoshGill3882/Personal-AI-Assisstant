/**
 * Form controls used to capture user prompts and quick actions.
 */

type ChatInputProps = {
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onRequestUpcoming: () => void;
};

export function ChatInput({
  value,
  busy,
  onChange,
  onSubmit,
  onRequestUpcoming,
}: ChatInputProps) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        className="chat-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Send a prompt to your assistant..."
        autoFocus
      />
      <div className="chat-actions">
        <button
          className="button primary"
          type="submit"
          disabled={busy || !value.trim()}
        >
          Send
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={onRequestUpcoming}
          disabled={busy}
        >
          Upcoming
        </button>
      </div>
    </form>
  );
}
