'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchSubjects,
  fetchDocuments,
  fetchRecentDocuments,
  fetchDocumentCount,
  fetchSubjectCount,
  fetchDocumentsBySubject,
  fetchStorageStats,
  fetchTotalStorageUsed,
  fetchUploadTimeline,
  fetchRecentWeekCount,
  fetchTags,
  fetchTagsWithCount,
  type DbSubject,
  type DbDocument,
  type DbTag,
} from './api';

// ── Generic hook wrapper ───────────────────────────────────

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useQuery<T>(fetcher: () => Promise<T>): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch((err) => setError(err?.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Hooks ──────────────────────────────────────────────────

export function useSubjects(): UseQueryResult<DbSubject[]> {
  return useQuery(fetchSubjects);
}

export function useDocuments(options?: {
  limit?: number;
  subjectId?: string;
  search?: string;
}): UseQueryResult<DbDocument[]> {
  const fetcher = useCallback(
    () => fetchDocuments(options),
    [options?.limit, options?.subjectId, options?.search],
  );
  return useQuery(fetcher);
}

export function useRecentDocuments(limit = 5): UseQueryResult<DbDocument[]> {
  const fetcher = useCallback(() => fetchRecentDocuments(limit), [limit]);
  return useQuery(fetcher);
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalSubjects: 0,
    totalStorageBytes: 0,
    recentWeekDocs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDocumentCount(),
      fetchSubjectCount(),
      fetchTotalStorageUsed(),
      fetchRecentWeekCount(),
    ])
      .then(([totalDocs, totalSubjects, totalStorageBytes, recentWeekDocs]) => {
        setStats({ totalDocs, totalSubjects, totalStorageBytes, recentWeekDocs });
      })
      .catch((err) => setError(err?.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: stats, loading, error, refetch };
}

export function useDocumentsBySubject() {
  return useQuery(fetchDocumentsBySubject);
}

export function useStorageStats() {
  return useQuery(fetchStorageStats);
}

export function useUploadTimeline(days = 7) {
  const fetcher = useCallback(() => fetchUploadTimeline(days), [days]);
  return useQuery(fetcher);
}

export function useTags(): UseQueryResult<DbTag[]> {
  return useQuery(fetchTags);
}

export function useTagsWithCount() {
  return useQuery(fetchTagsWithCount);
}
