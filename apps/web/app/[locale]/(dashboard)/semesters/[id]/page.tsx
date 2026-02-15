'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Semester, Subject } from '@/lib/types';

interface SemesterDetailPageProps {
  params: Promise<{ id: string }>;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#01FF80',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function SemesterDetailPage({ params }: SemesterDetailPageProps) {
  const { id } = use(params);
  const t = useTranslations();
  const router = useRouter();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    
    const [semesterRes, subjectsRes] = await Promise.all([
      supabase.from('semesters').select('*').eq('id', id).single(),
      supabase.from('subjects').select('*').eq('semester_id', id).order('name'),
    ]);

    if (semesterRes.data) {
      setSemester(semesterRes.data);
    }
    setSubjects(subjectsRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingSubject) {
      await supabase
        .from('subjects')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          color: formData.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSubject.id);
    } else {
      await supabase.from('subjects').insert({
        user_id: user.id,
        semester_id: id,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        color: formData.color,
      });
    }

    setSaving(false);
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '', color: COLORS[0] });
    fetchData();
  }

  async function handleDelete(subjectId: string) {
    if (!confirm(t('common.confirmDelete'))) return;
    await supabase.from('subjects').delete().eq('id', subjectId);
    fetchData();
  }

  function openCreateModal() {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setShowModal(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      color: subject.color,
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="space-y-4 fade-in">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="empty-state py-16">
        <h3 className="font-medium mb-1">{t('semesters.notFound')}</h3>
        <Link href="/semesters" className="btn btn-primary btn-sm mt-4">
          {t('semesters.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/semesters" className="hover:text-foreground">
          {t('semesters.title')}
        </Link>
        <span>/</span>
        <span className="text-foreground">{semester.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{semester.name}</h1>
          <p className="text-sm text-muted-foreground">
            {subjects.length} {t('subjects.title').toLowerCase()}
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('subjects.create')}
        </button>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">{t('subjects.empty')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('subjects.emptyDescription')}</p>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            {t('subjects.create')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="card p-4 hover:border-muted-foreground transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={subject.color} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); openEditModal(subject); }}
                    className="icon-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(subject.id); }}
                    className="icon-btn text-destructive"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="font-medium">{subject.name}</h3>
              {subject.code && (
                <p className="text-xs text-muted-foreground">{subject.code}</p>
              )}
              {subject.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate-2">{subject.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold">
                {editingSubject ? t('subjects.edit') : t('subjects.create')}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('subjects.name')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Calculus"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('subjects.code')}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="e.g. MATH101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('subjects.description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder={t('subjects.descriptionPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('subjects.color')}</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
