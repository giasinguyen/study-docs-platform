'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Semester } from '@/lib/types';

export default function SemestersPage() {
  const t = useTranslations();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    semester_number: 1 as 1 | 2 | 3,
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchSemesters();
  }, []);

  async function fetchSemesters() {
    setLoading(true);
    const { data } = await supabase
      .from('semesters')
      .select('*')
      .order('year', { ascending: false })
      .order('semester_number', { ascending: false });
    setSemesters(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingSemester) {
      await supabase
        .from('semesters')
        .update({
          name: formData.name,
          year: formData.year,
          semester_number: formData.semester_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSemester.id);
    } else {
      await supabase.from('semesters').insert({
        user_id: user.id,
        name: formData.name,
        year: formData.year,
        semester_number: formData.semester_number,
      });
    }

    setSaving(false);
    setShowModal(false);
    setEditingSemester(null);
    setFormData({ name: '', year: new Date().getFullYear(), semester_number: 1 });
    fetchSemesters();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDelete'))) return;
    await supabase.from('semesters').delete().eq('id', id);
    fetchSemesters();
  }

  function openCreateModal() {
    setEditingSemester(null);
    setFormData({
      name: `${t('semesters.semester')} ${formData.semester_number} - ${formData.year}`,
      year: new Date().getFullYear(),
      semester_number: 1,
    });
    setShowModal(true);
  }

  function openEditModal(semester: Semester) {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      year: semester.year,
      semester_number: semester.semester_number,
    });
    setShowModal(true);
  }

  const getSemesterLabel = (num: number) => {
    switch (num) {
      case 1: return t('semesters.semester1');
      case 2: return t('semesters.semester2');
      case 3: return t('semesters.summer');
      default: return '';
    }
  };

  // Group semesters by year
  const groupedSemesters = semesters.reduce((acc, sem) => {
    if (!acc[sem.year]) acc[sem.year] = [];
    acc[sem.year]!.push(sem);
    return acc;
  }, {} as Record<number, Semester[]>);

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('semesters.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('semesters.description')}</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('semesters.create')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-6 w-32 rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="skeleton h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h3 className="font-medium mb-1">{t('semesters.empty')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('semesters.emptyDescription')}</p>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            {t('semesters.create')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSemesters)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearSemesters]) => (
              <div key={year}>
                <h2 className="text-lg font-semibold mb-3">{t('semesters.year')} {year}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearSemesters.map((semester) => (
                    <Link
                      key={semester.id}
                      href={`/semesters/${semester.id}`}
                      className="card p-4 hover:border-muted-foreground transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.preventDefault(); openEditModal(semester); }}
                            className="icon-btn"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); handleDelete(semester.id); }}
                            className="icon-btn text-destructive"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-medium">{semester.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getSemesterLabel(semester.semester_number)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold">
                {editingSemester ? t('semesters.edit') : t('semesters.create')}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('semesters.year')}</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="input"
                      min={2000}
                      max={2100}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('semesters.semesterNumber')}</label>
                    <select
                      value={formData.semester_number}
                      onChange={(e) => setFormData({ ...formData, semester_number: parseInt(e.target.value) as 1 | 2 | 3 })}
                      className="input select"
                    >
                      <option value={1}>{t('semesters.semester1')}</option>
                      <option value={2}>{t('semesters.semester2')}</option>
                      <option value={3}>{t('semesters.summer')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('semesters.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder={`${t('semesters.semester')} 1 - 2026`}
                    required
                  />
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
