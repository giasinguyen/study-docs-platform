'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Hash,
  Palette,
  FileText,
  CalendarDays,
  GraduationCap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Semester, Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
  const [semester, setSemester] = useState<Semester | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: COLORS[0]!,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (semesterRes.data) setSemester(semesterRes.data);
    setSubjects(subjectsRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (editingSubject) {
      await supabase.from('subjects').update({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        color: formData.color,
        updated_at: new Date().toISOString(),
      }).eq('id', editingSubject.id);
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
    setFormData({ name: '', code: '', description: '', color: COLORS[0]! });
    fetchData();
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('subjects').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    fetchData();
  }

  function openCreateModal() {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '', color: COLORS[Math.floor(Math.random() * COLORS.length)]! });
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
      <div className="space-y-6 fade-in">
        <div className="space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <CalendarDays className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">{t('semesters.notFound')}</h3>
        <Link href="/semesters">
          <Button variant="lime" size="sm" className="mt-4">
            {t('semesters.backToList')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/semesters" className="hover:text-foreground transition-colors flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {t('semesters.title')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate">{semester.name}</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{semester.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {subjects.length} {t('subjects.title').toLowerCase()}
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} variant="lime" className="shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" />
          {t('subjects.create')}
        </Button>
      </div>

      {/* ── Subjects Grid ── */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 shadow-sm">
            <BookOpen className="w-9 h-9 text-primary/60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t('subjects.empty')}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t('subjects.emptyDescription')}</p>
          <Button onClick={openCreateModal} variant="lime">
            <Plus className="w-4 h-4" />
            {t('subjects.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="group relative">
              <Link
                href={`/subjects/${subject.id}`}
                className="block rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderTopColor: subject.color, borderTopWidth: '3px' }}
              >
                {/* Card header */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base leading-snug truncate group-hover:text-primary transition-colors">
                        {subject.name}
                      </h3>
                      {subject.code && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">{subject.code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {subject.description && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-muted-foreground truncate-2 leading-relaxed">
                      {subject.description}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>Xem tài liệu</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </div>
              </Link>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => { e.preventDefault(); openEditModal(subject); }}
                  className="w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shadow-sm"
                  title={t('common.edit')}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteId(subject.id); }}
                  className="w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors shadow-sm"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Subject Dialog ── */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setEditingSubject(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {editingSubject ? t('subjects.edit') : t('subjects.create')}
            </DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Cập nhật thông tin môn học' : 'Thêm môn học mới vào học kỳ này'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>{t('subjects.name')} <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Giải tích"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('subjects.code')}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: MATH101"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('subjects.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder={t('subjects.descriptionPlaceholder')}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                {t('subjects.color')}
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-xl border border-border">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all duration-150',
                      formData.color === color
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {/* Color preview */}
              <div
                className="h-1.5 rounded-full transition-colors duration-200"
                style={{ backgroundColor: formData.color }}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowModal(false); setEditingSubject(null); }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="lime" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Xóa môn học
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa môn học này? Tất cả tài liệu liên quan sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Đang xóa...' : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
