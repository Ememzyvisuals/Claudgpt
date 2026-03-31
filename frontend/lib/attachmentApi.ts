import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

async function apiFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Convert File to base64 ──────────────────────────────────
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:mime;base64, prefix — send raw base64
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Read file as text ───────────────────────────────────────
export async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export type AttachmentType = 'image' | 'text' | 'code' | 'pdf' | 'github';

export interface Attachment {
  id:       string;
  type:     AttachmentType;
  name:     string;
  content:  string;           // text OR base64 for images
  mimeType: string;
  language?: string;
  size?:    number;
  preview?: string;           // image data URL for display
}

// ── Process any file the user drops/selects ─────────────────
export async function processFile(file: File): Promise<Attachment> {
  const id       = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const mimeType = file.type || 'text/plain';
  const name     = file.name;

  if (mimeType.startsWith('image/')) {
    const base64  = await fileToBase64(file);
    const preview = `data:${mimeType};base64,${base64}`;
    return { id, type: 'image', name, content: base64, mimeType, size: file.size, preview };
  }

  // Text / code / other
  const content = await fileToText(file);
  const ext     = name.split('.').pop()?.toLowerCase() || '';
  const codeExts: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', go: 'go', rs: 'rust', java: 'java', cpp: 'cpp',
    sql: 'sql', sh: 'bash', yaml: 'yaml', yml: 'yaml', json: 'json',
    html: 'html', css: 'css', scss: 'scss', md: 'markdown',
  };
  const type = codeExts[ext] ? 'code' : 'text';

  return { id, type, name, content, mimeType, language: codeExts[ext] || 'text', size: file.size };
}

// ── Analyse image with vision model ─────────────────────────
export async function analyseImage(attachment: Attachment, prompt?: string) {
  return apiFetch<{ description: string }>('/api/attachments/analyse-image', {
    filename: attachment.name,
    base64:   attachment.content,
    mimeType: attachment.mimeType,
    prompt,
  });
}

// ── Fetch GitHub repo ────────────────────────────────────────
export async function fetchGitHubRepo(repoUrl: string) {
  return apiFetch<{ attachments: Attachment[]; fileCount: number }>(
    '/api/attachments/github',
    { repoUrl }
  );
}

// ── Send message with attachments ───────────────────────────
export async function chatWithAttachments(
  message: string,
  sessionId: string,
  textAttachments: Attachment[],
  imageAttachments: Attachment[]
) {
  return apiFetch<{ response: string; modelUsed?: string }>(
    '/api/attachments/chat-with-context',
    {
      message,
      sessionId,
      attachments: textAttachments.map((a) => ({
        type: a.type, name: a.name, content: a.content, language: a.language,
      })),
      images: imageAttachments.map((a) => ({
        mimeType: a.mimeType, base64: a.content,
      })),
    }
  );
}
