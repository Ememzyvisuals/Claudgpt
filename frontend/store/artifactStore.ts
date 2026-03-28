import { create } from 'zustand';

export interface Artifact {
  id:        string;
  sessionId: string;
  messageId: string;
  type:      'code' | 'html' | 'react' | 'markdown' | 'json' | 'svg';
  title:     string;
  content:   string;
  language:  string;
  createdAt: string;
}

interface ArtifactState {
  artifacts:       Artifact[];
  activeArtifactId: string | null;
  panelOpen:        boolean;

  addArtifact:      (artifact: Artifact) => void;
  setActive:        (id: string | null) => void;
  setPanelOpen:     (open: boolean) => void;
  updateArtifact:   (id: string, content: string) => void;
  clearForSession:  (sessionId: string) => void;
  getActive:        () => Artifact | null;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts:        [],
  activeArtifactId: null,
  panelOpen:        false,

  addArtifact: (artifact) => set((s) => ({
    artifacts: [...s.artifacts.filter((a) => a.id !== artifact.id), artifact],
    activeArtifactId: artifact.id,
    panelOpen: true,
  })),

  setActive:    (id)   => set({ activeArtifactId: id, panelOpen: id !== null }),
  setPanelOpen: (open) => set({ panelOpen: open }),

  updateArtifact: (id, content) => set((s) => ({
    artifacts: s.artifacts.map((a) => a.id === id ? { ...a, content } : a),
  })),

  clearForSession: (sessionId) => set((s) => ({
    artifacts: s.artifacts.filter((a) => a.sessionId !== sessionId),
    activeArtifactId: null,
    panelOpen: false,
  })),

  getActive: () => {
    const { artifacts, activeArtifactId } = get();
    return artifacts.find((a) => a.id === activeArtifactId) || null;
  },
}));

// ── Detect artifacts inside streaming AI responses ────────────
export function extractArtifacts(
  content: string,
  sessionId: string,
  messageId: string
): Artifact[] {
  const artifacts: Artifact[] = [];

  // Match ``` code blocks with language
  const codeRegex = /```(\w+)\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeRegex.exec(content)) !== null) {
    const lang    = match[1].toLowerCase();
    const code    = match[2];

    if (code.trim().length < 50) continue; // skip tiny snippets

    const type = lang === 'html' ? 'html'
      : lang === 'jsx' || lang === 'tsx' || lang === 'react' ? 'react'
      : lang === 'json' ? 'json'
      : lang === 'svg'  ? 'svg'
      : lang === 'md' || lang === 'markdown' ? 'markdown'
      : 'code';

    // Extract a title from nearby text
    const beforeBlock = content.slice(Math.max(0, match.index - 120), match.index);
    const titleMatch  = beforeBlock.match(/(?:^|\n)(?:#+\s+|[-•]\s*)?([^\n]{5,60})\s*$/);
    const title = titleMatch ? titleMatch[1].trim() : `${lang.toUpperCase()} — File ${index + 1}`;

    artifacts.push({
      id:        `art-${messageId}-${index}`,
      sessionId,
      messageId,
      type,
      title,
      content:   code,
      language:  lang,
      createdAt: new Date().toISOString(),
    });
    index++;
  }

  return artifacts;
}
