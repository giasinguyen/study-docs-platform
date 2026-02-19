'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  GraduationCap,
  Sun,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Semester } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SEMESTER_CONFIG = {
  1: {
    label: 'Học kỳ 1',
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
  },
  2: {
    label: 'Học kỳ 2',
    icon: GraduationCap,
    gradient: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    dot: 'bg-violet-400',
  },
  3: {
    label: 'Học kỳ hè',
    icon: Sun,
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
  },
} as const;

export default function SemestersPage() {
  const t = useTranslations();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    semester_number: 1 as 1 | 2 | 3,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!user) { setSaving(false); return; }

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

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('semesters').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    fetchSemesters();
  }

  function openCreateModal() {
    setEditingSemester(null);
    const year = new Date().getFullYear();
    setFormData({ name: `Học kỳ 1 - ${year}`, year, semester_number: 1 });
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

  function autoFillName(year: number, num: 1 | 2 | 3) {
    const cfg = SEMESTER_CONFIG[num];
    setFormData((prev) => ({ ...prev, name: `${cfg.label} - ${year}`, year, semester_number: num }));
  }

  // Group semesters by year
  const groupedSemesters = semesters.reduce((acc, sem) => {
    if (!acc[sem.year]) acc[sem.year] = [];
    acc[sem.year]!.push(sem);
    return acc;
  }, {} as Record<number, Semester[]>);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-sm">
            <CalendarDays className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('semesters.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('semesters.description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!loading && semesters.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5 border border-border">
                <Layers className="w-3.5 h-3.5" />
                {semesters.length} học kỳ
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5 border border-border">
                <CalendarDays className="w-3.5 h-3.5" />
                {Object.keys(groupedSemesters).length} năm học
              </span>
            </div>
          )}
          <Button onClick={openCreateModal} variant="lime" className="shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" />
            {t('semesters.create')}
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton h-5 w-28 rounded-md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="skeleton h-36 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : semesters.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 shadow-sm">
            <CalendarDays className="w-9 h-9 text-primary/60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t('semesters.empty')}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t('semesters.emptyDescription')}</p>
          <Button onClick={openCreateModal} variant="lime">
            <Plus className="w-4 h-4" />
            {t('semesters.create')}
          </Button>
        </div>
      ) : (
        /* ── Grouped by Year ── */
        <div className="space-y-8">
          {Object.entries(groupedSemesters)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearSemesters]) => (
              <div key={year} className="space-y-3">
                {/* Year heading */}
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Năm học {year}–{Number(year) + 1}
                  </h2>
                  {Number(year) === currentYear && (
                    <Badge variant="lime" className="text-[10px] h-5">Hiện tại</Badge>
                  )}
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Semester cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearSemesters
                    .sort((a, b) => a.semester_number - b.semester_number)
                    .map((semester) => {
                      const cfg = SEMESTER_CONFIG[semester.semester_number as 1 | 2 | 3] ?? SEMESTER_CONFIG[1];
                      const Icon = cfg.icon;
                      return (
                        <div key={semester.id} className="group relative">
                          <Link
                            href={`/semesters/${semester.id}`}
                            className={cn(
                              'block rounded-2xl border bg-card overflow-hidden transition-all duration-200',
                              'hover:shadow-lg hover:-translate-y-0.5',
                              cfg.border,
                            )}
                          >
                            {/* Gradient header */}
                            <div className={cn('px-4 pt-4 pb-3 bg-gradient-to-br', cfg.gradient)}>
                              <div className="flex items-start justify-between">
                                <div className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center',
                                  'bg-background/60 backdrop-blur-sm border border-border/50',
                                )}>
                                  <Icon className="w-5 h-5 text-foreground/80" />
                                </div>
                                <span className={cn(
                                  'text-[11px] font-semibold px-2.5 py-1 rounded-full border',
                                  cfg.badge,
                                )}>
                                  {cfg.label}
                                </span>
                              </div>
                            </div>

                            {/* Card body */}
                            <div className="px-4 py-3">
                              <h3 className="font-semibold text-base leading-snug mb-0.5 group-hover:text-primary transition-colors">
                                {semester.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                                Năm {year}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-3 flex items-center">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ChevronRight className="w-3 h-3" />
                                Xem môn học
                              </span>
                            </div>
                          </Link>

                          {/* Action buttons (hover) */}
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={(e) => { e.preventDefault(); openEditModal(semester); }}
                              className="w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shadow-sm"
                              title={t('common.edit')}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); setDeleteId(semester.id); }}
                              className="w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors shadow-sm"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setEditingSemester(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              {editingSemester ? t('semesters.edit') : t('semesters.create')}
            </DialogTitle>
            <DialogDescription>
              {editingSemester ? 'Cập nhật thông tin học kỳ' : 'Điền thông tin để tạo học kỳ mới'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('semesters.year')}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => autoFillName(parseInt(e.target.value), formData.semester_number)}
                  min={2000}
                  max={2100}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('semesters.semesterNumber')}</Label>
                <Select
                  value={String(formData.semester_number)}
                  onValueChange={(v) => autoFillName(formData.year, parseInt(v) as 1 | 2 | 3)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('semesters.semester1')}</SelectItem>
                    <SelectItem value="2">{t('semesters.semester2')}</SelectItem>
                    <SelectItem value="3">{t('semesters.summer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('semesters.name')}</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Học kỳ 1 - ${new Date().getFullYear()}`}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowModal(false); setEditingSemester(null); }}
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
              Xóa học kỳ
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa học kỳ này? Tất cả môn học và tài liệu liên quan sẽ bị xóa vĩnh viễn.
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
    </div>
  );
}
