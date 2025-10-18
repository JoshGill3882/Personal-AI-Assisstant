/**
 * Helpers for reading environment-level configuration provided by Vite.
 */

type ThemeEnv = {
  VITE_API_BASE?: string;
};

/** Build the API base URL, falling back to sensible localhost defaults. */
export function getApiBase() {
  const env = (import.meta as any).env as ThemeEnv;
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
