export const APP_IDENTITY = {
  name:    'ClaudGPT',
  version: '1.0.0',
  creator: 'Emmanuel ARIYO',
  alias:   'Emmanuel.A',
  company: 'EMEMZYVISUALS DIGITALS',
} as const;

export type AgentType =
  | 'planner' | 'architect' | 'coder'
  | 'debugger' | 'reviewer'  | 'tool'
  | 'memory'   | 'search'    | 'export';

export type AgentMode = 'full' | 'single' | 'stream';

export interface AgentTask {
  taskId:     string;
  prompt:     string;
  userId:     string;
  projectId?: string;
  sessionId?: string;
  mode:       AgentMode;
  agentType?: AgentType;
  context?:   string;
}

export interface AgentResult {
  agentType:  AgentType;
  output:     string;
  files?:     ParsedFile[];
  metadata?:  Record<string, unknown>;
  durationMs: number;
}

export interface ChatMessage {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

export interface ParsedFile {
  path:     string;
  content:  string;
  language: string;
}

export type ProjectType =
  | 'web' | 'whatsapp-bot' | 'automation'
  | 'api' | 'fullstack'    | 'other';

export type ProjectStatus =
  | 'active' | 'archived' | 'building' | 'complete';

export interface GroqStreamOptions {
  temperature?:  number;
  maxTokens?:    number;
  systemPrompt?: string;
  agentType?:    string;  // ← triggers smart model routing
}
