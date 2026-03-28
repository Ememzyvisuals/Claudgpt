import { supabase } from './supabase';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  return res.json();
}
export const chatApi = {
  createSession: (title?: string) => apiFetch<{ session: unknown }>('/api/chat/sessions', { method: 'POST', body: JSON.stringify({ title }) }),
  getSessions: () => apiFetch<{ sessions: unknown[] }>('/api/chat/sessions'),
  deleteSession: (id: string) => apiFetch<{ message: string }>(`/api/chat/sessions/${id}`, { method: 'DELETE' }),
  updateSession: (id: string, title: string) => apiFetch<{ session: unknown }>(`/api/chat/sessions/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  updateSession: (id: string, title: string) => apiFetch<{ session: unknown }>(`/api/chat/sessions/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  getMessages: (id: string) => apiFetch<{ messages: unknown[] }>(`/api/chat/sessions/${id}/messages`),
};
export async function streamChat(
  sessionId: string,
  message: string,
  onChunk: (c: string) => void,
  onDone: () => void,
  onError?: (e: string) => void,
  onTitleUpdate?: (title: string) => void
): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) { onError?.(`Stream failed: HTTP ${res.status}`); return; }
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) { onError?.('No body'); return; }
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const p = JSON.parse(line.slice(6));
        if (p.chunk) onChunk(p.chunk);
        if (p.titleUpdate && onTitleUpdate) onTitleUpdate(p.titleUpdate);
        if (p.done) onDone();
        if (p.error) onError?.(p.error);
        if (p.limitReached) onError?.('Daily limit reached (25 messages). Add your own API key in Settings → API Keys for unlimited access.');
      } catch { /* ignore */ }
    }
  }
}
export const projectApi = {
  create: (data: { name: string; description?: string; type?: string }) => apiFetch<{ project: unknown }>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiFetch<{ projects: unknown[] }>('/api/projects'),
  getById: (id: string) => apiFetch<{ project: unknown }>(`/api/projects/${id}`),
  update: (id: string, data: Record<string, unknown>) => apiFetch<{ project: unknown }>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ message: string }>(`/api/projects/${id}`, { method: 'DELETE' }),
  getFiles: (id: string) => apiFetch<{ files: unknown[] }>(`/api/projects/${id}/files`),
  saveFile: (id: string, filePath: string, content: string, language: string) => apiFetch<{ file: unknown }>(`/api/projects/${id}/files`, { method: 'POST', body: JSON.stringify({ filePath, content, language }) }),
};
export const exportApi = {
  downloadZip: async (projectId: string, projectName: string) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/export/zip/${projectId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${projectName}.zip`; a.click(); URL.revokeObjectURL(url);
  },
  downloadMarkdown: async (projectId: string, projectName: string) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/export/markdown/${projectId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${projectName}.md`; a.click(); URL.revokeObjectURL(url);
  },
};

export const searchApi = {
  search: (query: string) =>
    apiFetch<{ response: string; usedSearch: boolean; model: string }>(
      '/api/search',
      { method: 'POST', body: JSON.stringify({ query }) }
    ),
};

export const userSettingsApi = {
  get: () => apiFetch<{
    provider: string; model: string; theme: string; fontSize: string; codeTheme: string;
    isFreeUser: boolean; messagesLeft: number; dailyLimit: number;
    hasGroqKey: boolean; hasOpenaiKey: boolean; hasAnthropicKey: boolean; hasOpenrouterKey: boolean;
    availableModels: Record<string, string[]>;
  }>('/api/settings'),

  update: (data: {
    provider?: string; model?: string; theme?: string; fontSize?: string; codeTheme?: string;
    groqKey?: string; openaiKey?: string; anthropicKey?: string; openrouterKey?: string;
  }) => apiFetch<{ message: string }>('/api/settings', {
    method: 'PUT',
    body:   JSON.stringify(data),
  }),
};
