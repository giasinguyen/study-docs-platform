import { createClient } from '@/lib/supabase/client';

// ── Types matching Supabase/Prisma tables ──────────────────

export interface DbSubject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbDocument {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  storage_type: 'SUPABASE' | 'CLOUDINARY' | 'GDRIVE';
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  // joined
  subjects?: DbSubject;
}

export interface DbTag {
  id: string;
  name: string;
  created_at: string;
}

export interface DbDocumentTag {
  document_id: string;
  tag_id: string;
  tags?: DbTag;
}

// ── Query functions ────────────────────────────────────────

const supabase = () => createClient();

/** Fetch all subjects for the current user */
export async function fetchSubjects() {
  const { data, error } = await supabase()
    .from('subjects')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbSubject[];
}

/** Fetch all documents for the current user (with subject) */
export async function fetchDocuments(options?: {
  limit?: number;
  subjectId?: string;
  search?: string;
  orderBy?: string;
}) {
  let query = supabase()
    .from('documents')
    .select('*, subjects(id, name, color)')
    .order('created_at', { ascending: false });

  if (options?.subjectId) {
    query = query.eq('subject_id', options.subjectId);
  }
  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%,file_name.ilike.%${options.search}%`,
    );
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbDocument[];
}

/** Fetch recent documents (last N) */
export async function fetchRecentDocuments(limit = 5) {
  return fetchDocuments({ limit });
}

/** Count total documents */
export async function fetchDocumentCount() {
  const { count, error } = await supabase()
    .from('documents')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Count total subjects */
export async function fetchSubjectCount() {
  const { count, error } = await supabase()
    .from('subjects')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Get documents grouped by subject (for charts) */
export async function fetchDocumentsBySubject() {
  const { data, error } = await supabase()
    .from('documents')
    .select('subject_id, subjects(name)');
  if (error) throw error;

  const countMap: Record<string, { name: string; docs: number }> = {};
  for (const doc of data ?? []) {
    const subjectName =
      (doc as any).subjects?.name ?? 'Chưa phân loại';
    if (!countMap[doc.subject_id]) {
      countMap[doc.subject_id] = { name: subjectName, docs: 0 };
    }
    countMap[doc.subject_id]!.docs++;
  }
  return Object.values(countMap).sort((a, b) => b.docs - a.docs);
}

/** Get storage stats (total bytes by storage_type) */
export async function fetchStorageStats() {
  // Try querying with storage_type first; fall back to file_size only
  // (the column may not exist yet in the Supabase table)
  const withType = await supabase()
    .from('documents')
    .select('storage_type, file_size');

  const hasStorageType = !withType.error;

  const stats: Record<string, { totalBytes: number; fileCount: number }> = {
    SUPABASE: { totalBytes: 0, fileCount: 0 },
    GDRIVE: { totalBytes: 0, fileCount: 0 },
    CLOUDINARY: { totalBytes: 0, fileCount: 0 },
  };

  if (hasStorageType && withType.data) {
    for (const doc of withType.data) {
      const type = (doc as Record<string, unknown>).storage_type as string || 'SUPABASE';
      if (!stats[type]) stats[type] = { totalBytes: 0, fileCount: 0 };
      stats[type]!.totalBytes += Number(doc.file_size) || 0;
      stats[type]!.fileCount++;
    }
  } else {
    // Fallback: query only file_size, assume all are SUPABASE
    const { data, error } = await supabase()
      .from('documents')
      .select('file_size');
    if (error) throw error;
    for (const doc of data ?? []) {
      stats.SUPABASE.totalBytes += Number(doc.file_size) || 0;
      stats.SUPABASE.fileCount++;
    }
  }

  return stats;
}

/** Get total storage used in bytes */
export async function fetchTotalStorageUsed() {
  const { data, error } = await supabase()
    .from('documents')
    .select('file_size');
  if (error) throw error;

  let total = 0;
  for (const doc of data ?? []) {
    total += Number(doc.file_size) || 0;
  }
  return total;
}

/** Get upload timeline (documents per day for last 7 days) */
export async function fetchUploadTimeline(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase()
    .from('documents')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by day
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const countByDay: Record<string, number> = {};

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0]!;
    countByDay[key] = 0;
  }

  for (const doc of data ?? []) {
    const key = doc.created_at.split('T')[0];
    if (key && countByDay[key] !== undefined) {
      countByDay[key]++;
    }
  }

  return Object.entries(countByDay).map(([dateStr, uploads]) => {
    const d = new Date(dateStr);
    return {
      date: dayLabels[d.getDay()] || dateStr,
      fullDate: dateStr,
      uploads,
    };
  });
}

/** Get recent 7 days document count */
export async function fetchRecentWeekCount() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { count, error } = await supabase()
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());

  if (error) throw error;
  return count ?? 0;
}

/** Get unclassified documents count (no subject or null subject) */
export async function fetchUnclassifiedCount() {
  const { count, error } = await supabase()
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .is('subject_id', null);

  if (error) throw error;
  return count ?? 0;
}

/** Fetch all tags */
export async function fetchTags() {
  const { data, error } = await supabase()
    .from('tags')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbTag[];
}

/** Fetch tags with document count */
export async function fetchTagsWithCount() {
  const { data, error } = await supabase()
    .from('tags')
    .select('*, document_tags(document_id)');
  if (error) throw error;
  return (data ?? []).map((tag: any) => ({
    ...tag,
    document_count: tag.document_tags?.length ?? 0,
  }));
}

/** Fetch document tags for a given document */
export async function fetchDocumentTags(documentId: string) {
  const { data, error } = await supabase()
    .from('document_tags')
    .select('*, tags(*)')
    .eq('document_id', documentId);
  if (error) throw error;
  return (data ?? []) as DbDocumentTag[];
}
