export type Provider = 
  | 'nvidia' 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'groq' 
  | 'deepseek' 
  | 'mistral' 
  | 'ollama' 
  | 'openrouter';

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  contextWindow: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  cost?: number;
  branchId?: string;
  parentId?: string;
}

export interface SessionMetrics {
  duration: number;
  tokensPerSecond: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

export interface Theme {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  border: string;
  muted: string;
}

export const THEMES: Theme[] = [
  {
    name: 'Dracula',
    bg: '#282a36',
    fg: '#f8f8f2',
    accent: '#bd93f9',
    border: '#44475a',
    muted: '#6272a4',
  },
  {
    name: 'Nord',
    bg: '#2e3440',
    fg: '#d8dee9',
    accent: '#88c0d0',
    border: '#4c566a',
    muted: '#434c5e',
  },
  {
    name: 'Tokyo Night',
    bg: '#1a1b26',
    fg: '#c0caf5',
    accent: '#7aa2f7',
    border: '#24283b',
    muted: '#565f89',
  },
  {
    name: 'Catppuccin',
    bg: '#1e1e2e',
    fg: '#cdd6f4',
    accent: '#cba6f7',
    border: '#313244',
    muted: '#6c7086',
  },
  {
    name: 'Monokai',
    bg: '#272822',
    fg: '#f8f8f2',
    accent: '#a6e22e',
    border: '#49483e',
    muted: '#75715e',
  }
];
