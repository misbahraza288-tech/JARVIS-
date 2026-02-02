
export enum AppView {
  INTELLIGENCE = 'intelligence',
  VISION = 'vision',
  PRESENCE = 'presence',
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
  images?: string[];
}

export interface GenerationResult {
  id: string;
  type: 'image' | 'video';
  url: string;
prompt: string;
  status: 'loading' | 'completed' | 'error';
}

/**
 * AIStudio interface as defined by the application environment for key selection.
 */
export interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    /**
     * The aistudio property provides methods for API key management and must match 
     * the global AIStudio type and modifiers (readonly) established in the environment.
     */
    readonly aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}