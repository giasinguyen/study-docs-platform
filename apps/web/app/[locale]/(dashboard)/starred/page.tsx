'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Document, Subject } from '@/lib/types';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getFileIcon(type: string | undefined) {
  const iconClass = "w-5 h-5";
  switch (type?.toLowerCase()) {
    case 'pdf':
      return <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" /></svg></div>;
    default:
      return <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" /></svg></div>;
  }
}

export default function StarredPage() {
  const t = useTranslations();
  const [documents, setDocuments] = useState<(Document & { subject?: Subject })[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*, subject:subjects(*)')
      .eq('is_deleted', false)
      .eq('is_starred', true)
      .order('updated_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  }

  async function handleToggleStar(docId: string) {
    await supabase.from('documents').update({ is_starred: false }).eq('id', docId);
    fetchDocuments();
  }

  async function handleDownload(doc: Document) {
    const { data } = await supabase.storage.from('documents').download(doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h1 className="text-xl font-semibold">{t('nav.starred')}</h1>
        <p className="text-sm text-muted-foreground">{documents.length} {t('documents.title').toLowerCase()}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">{t('starred.empty')}</h3>
          <p className="text-sm text-muted-foreground">{t('starred.emptyDescription')}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>{t('documents.fileName')}</th>
                <th className="hidden md:table-cell">{t('subjects.title')}</th>
                <th className="hidden lg:table-cell">{t('documents.fileSize')}</th>
                <th className="hidden sm:table-cell">{t('documents.uploadedAt')}</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.file_type)}
                      <span className="font-medium truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    {doc.subject && (
                      <Link href={`/subjects/${doc.subject.id}`} className="badge badge-outline hover:bg-muted">
                        {doc.subject.name}
                      </Link>
                    )}
                  </td>
                  <td className="hidden lg:table-cell text-muted-foreground">{formatFileSize(doc.file_size)}</td>
                  <td className="hidden sm:table-cell text-muted-foreground">{formatDate(doc.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggleStar(doc.id)} className="icon-btn text-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button onClick={() => handleDownload(doc)} className="icon-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
