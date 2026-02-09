'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  BookOpen,
  RotateCcw,
  FileText,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useSubjects, useDocuments, useDocumentsBySubject } from '@/lib/hooks';
import { formatRelativeTime, formatFileSize } from '@/lib/utils';

export default function PlannerPage() {
  const { data: subjects, loading: subjectsLoading } = useSubjects();
  const { data: allDocs, loading: docsLoading } = useDocuments({ limit: 100 });
  const { data: subjectData, loading: subjectDataLoading } = useDocumentsBySubject();

  const loading = subjectsLoading || docsLoading || subjectDataLoading;

  // Review reminders — docs not updated in a while
  const reviewDocs = useMemo(() => {
    if (!allDocs) return [];
    const now = Date.now();
    return allDocs
      .filter((doc) => {
        const updatedAt = new Date(doc.updated_at ?? doc.created_at).getTime();
        const daysSince = (now - updatedAt) / (1000 * 60 * 60 * 24);
        return daysSince > 5;
      })
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
      .slice(0, 6)
      .map((doc) => {
        const daysSince = Math.floor((now - new Date(doc.updated_at ?? doc.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...doc,
          daysSince,
          urgency: daysSince > 20 ? 'high' as const : daysSince > 10 ? 'medium' as const : 'low' as const,
          subjectName: (doc as any).subjects?.name ?? 'Chưa phân loại',
        };
      });
  }, [allDocs]);

  // Recently active docs (last 7 days)
  const recentDocs = useMemo(() => {
    if (!allDocs) return [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allDocs.filter((doc) => new Date(doc.created_at).getTime() > weekAgo);
  }, [allDocs]);

  // Weekly stats
  const totalDocs = allDocs?.length ?? 0;
  const totalSubjects = subjects?.length ?? 0;
  const recentCount = recentDocs.length;
  const reviewCount = reviewDocs.length;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi tiến độ học tập và nhắc nhở ôn tập</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="size-3.5" /> Tổng tài liệu
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : totalDocs}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="size-3.5 text-primary" /> Môn học
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : totalSubjects}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="size-3.5 text-blue-400" /> Tuần này
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : recentCount}</p>
          <p className="text-[11px] text-muted-foreground">tài liệu mới</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="size-3.5 text-warning" /> Cần ôn tập
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : reviewCount}</p>
          <p className="text-[11px] text-muted-foreground">tài liệu lâu chưa xem</p>
        </Card>
      </div>

      {/* Study Progress by Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" /> Tiến độ theo môn học
          </CardTitle>
          <CardDescription>Số lượng tài liệu đã tải lên theo từng môn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : !subjectData || subjectData.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu môn học</div>
          ) : (
            subjectData.map((item) => {
              const maxDocs = subjectData[0]?.docs ?? 1;
              const percent = Math.round((item.docs / maxDocs) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.docs} tài liệu</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Review Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="size-4 text-primary" /> Nhắc nhở ôn tập
          </CardTitle>
          <CardDescription>Tài liệu lâu chưa xem lại — nên review theo phương pháp spaced repetition</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : reviewDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-8 text-primary/40 mb-2" />
              <p className="text-sm text-muted-foreground">Tất cả tài liệu đều được xem gần đây</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Hãy tiếp tục duy trì thói quen ôn tập!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <BookOpen className="size-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title ?? doc.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {doc.subjectName} · Xem lần cuối: {formatRelativeTime(doc.updated_at)}
                    </p>
                  </div>
                  <Badge
                    variant={doc.urgency === 'high' ? 'destructive' : doc.urgency === 'medium' ? 'warning' : 'secondary'}
                    className="text-[10px]"
                  >
                    {doc.urgency === 'high' ? 'Cần review' : doc.urgency === 'medium' ? 'Nên review' : 'Bình thường'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Added This Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" /> Hoạt động tuần này
          </CardTitle>
          <CardDescription>Tài liệu được thêm trong 7 ngày gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có tài liệu nào tuần này</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Hãy tải lên tài liệu mới để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocs.slice(0, 8).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title ?? doc.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(doc as any).subjects?.name ?? 'Chưa phân loại'} · {formatRelativeTime(doc.created_at)}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
