import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Get auth token from Supabase session */
async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

/** Generic fetch wrapper with auth */
async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res;
}

// ── Documents API ────────────────────────────────────────

export interface UploadDocumentParams {
  file: File;
  title: string;
  description?: string;
  subjectId: string;
  tags?: string[];
}

export async function uploadDocument(params: UploadDocumentParams) {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('title', params.title);
  if (params.description) {
    formData.append('description', params.description);
  }
  formData.append('subjectId', params.subjectId);
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach((tag) => formData.append('tags', tag));
  }

  const res = await apiFetch('/documents', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed: ${res.status}`);
  }

  return res.json();
}

// ── AI API ──────────────────────────────────────────────

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  source: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardResult {
  flashcards: Flashcard[];
  source: string;
}

export interface ChatResult {
  reply: string;
  sources?: string[];
}

export async function aiSummarize(
  file: File,
  length: 'short' | 'medium' | 'detailed' = 'medium',
): Promise<SummaryResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('length', length);

  const res = await apiFetch('/ai/summarize', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Summarize failed: ${res.status}`);
  }

  return res.json();
}

export async function aiFlashcards(
  file: File,
  count: number = 10,
): Promise<FlashcardResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('count', count.toString());

  const res = await apiFetch('/ai/flashcards', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Flashcards failed: ${res.status}`);
  }

  return res.json();
}

export interface ChatMessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export async function aiChat(params: {
  file?: File;
  documentText?: string;
  message: string;
  history?: ChatMessageParam[];
}): Promise<ChatResult> {
  const formData = new FormData();
  if (params.file) {
    formData.append('file', params.file);
  }
  if (params.documentText) {
    formData.append('documentText', params.documentText);
  }
  formData.append('message', params.message);
  if (params.history && params.history.length > 0) {
    formData.append('history', JSON.stringify(params.history));
  }

  const res = await apiFetch('/ai/chat', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Chat failed: ${res.status}`);
  }

  return res.json();
}
