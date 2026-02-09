'use client';

import { useState, useEffect } from 'react';
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
  return <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground opacity-50"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" /></svg></div>;
}

export default function TrashPage() {
  const t = useTranslations();
  const [documents, setDocuments] = useState<(Document & { subject?: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*, subject:subjects(*)')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  }

  async function handleRestore(docIds: string[]) {
    await supabase
      .from('documents')
      .update({ is_deleted: false, deleted_at: null })
      .in('id', docIds);
    setSelectedDocs([]);
    fetchDocuments();
  }

  async function handlePermanentDelete(docIds: string[]) {
    if (!confirm(t('trash.confirmPermanentDelete'))) return;
    
    // Delete from storage first
    for (const docId of docIds) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }
    }
    
    // Delete from database
    await supabase.from('documents').delete().in('id', docIds);
    setSelectedDocs([]);
    fetchDocuments();
  }

  async function handleEmptyTrash() {
    if (!confirm(t('trash.confirmEmptyTrash'))) return;
    
    // Delete all files from storage
    for (const doc of documents) {
      await supabase.storage.from('documents').remove([doc.file_path]);
    }
    
    // Delete all from database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('documents').delete().eq('user_id', user.id).eq('is_deleted', true);
    }
    fetchDocuments();
  }

  function toggleSelectDoc(id: string) {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d.id));
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('nav.trash')}</h1>
          <p className="text-sm text-muted-foreground">{documents.length} {t('documents.title').toLowerCase()}</p>
        </div>
        {documents.length > 0 && (
          <button onClick={handleEmptyTrash} className="btn btn-danger btn-sm">
            {t('trash.emptyTrash')}
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedDocs.length} {t('documents.selected')}</span>
          <button onClick={() => handleRestore(selectedDocs)} className="btn btn-sm btn-secondary">
            {t('trash.restore')}
          </button>
          <button onClick={() => handlePermanentDelete(selectedDocs)} className="btn btn-sm btn-danger">
            {t('trash.deletePermanently')}
          </button>
          <button onClick={() => setSelectedDocs([])} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            {t('documents.deselect')}
          </button>
        </div>
      )}

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
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">{t('trash.empty')}</h3>
          <p className="text-sm text-muted-foreground">{t('trash.emptyDescription')}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length === documents.length && documents.length > 0}
                    onChange={toggleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th>{t('documents.fileName')}</th>
                <th className="hidden md:table-cell">{t('subjects.title')}</th>
                <th className="hidden sm:table-cell">{t('trash.deletedAt')}</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="group opacity-60 hover:opacity-100">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleSelectDoc(doc.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.file_type)}
                      <span className="font-medium truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell text-muted-foreground">
                    {doc.subject?.name || '-'}
                  </td>
                  <td className="hidden sm:table-cell text-muted-foreground">
                    {doc.deleted_at ? formatDate(doc.deleted_at) : '-'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRestore([doc.id])} className="btn btn-sm btn-ghost">
                        {t('trash.restore')}
                      </button>
                      <button onClick={() => handlePermanentDelete([doc.id])} className="icon-btn text-destructive">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
