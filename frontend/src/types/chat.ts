/**
 * Shared chat-related type definitions used across the frontend.
 */

export type Role = "system" | "user" | "assistant";

// Local conversation state never stores the system prompt.
export type Msg = {
  role: Exclude<Role, "system">;
  content: string;
};

export type ChatMessage = { role: Role; content: string };
export type ChatRequest = { messages: ChatMessage[] };
export type ChatResponse = { reply: string };
export type UpcomingResponse = { text: string };
