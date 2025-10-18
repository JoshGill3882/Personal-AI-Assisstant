/**
 * Utility helpers for normalising Axios errors into user-friendly messages.
 */

import axios, { AxiosError } from "axios";

export function formatAxiosError(err: unknown): string {
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
