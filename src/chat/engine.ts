export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatEngine {
  ask(messages: ChatMessage[]): AsyncIterable<string>;
}
