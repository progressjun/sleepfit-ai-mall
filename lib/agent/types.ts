export type AgentRole = "user" | "assistant";
export type AgentAccessMode = "chat" | "auto";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
}

export interface AgentMemory {
  id: string;
  text: string;
  weight: number;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AgentToolEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "success" | "error" | "blocked";
  result: string;
  createdAt: string;
}

export interface AgentReview {
  id: string;
  createdAt: string;
  summary: string;
  wins: string[];
  blindSpots: string[];
  improvedOperatingNotes: string[];
  nextSuggestions: string[];
  memoryUpdates: string[];
}

export interface AgentClientSettings {
  apiKey: string;
  model: string;
  accessMode: AgentAccessMode;
  workingDirectory: string;
  maxToolSteps: number;
}
