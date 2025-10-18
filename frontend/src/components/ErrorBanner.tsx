/**
 * Inline error banner displayed beneath the input controls.
 */

type ErrorBannerProps = {
  message: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="chat-error" role="alert">
      <strong>Error:</strong> {message}
    </div>
  );
}
