'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Bot,
  ArrowUpRight,
  Upload,
  BookOpen,
} from 'lucide-react';
import { formatRelativeTime, formatFileSize } from '@/lib/utils';
import { useRecentDocuments, useStorageStats, useDocumentsBySubject } from '@/lib/hooks';
import { UploadModal } from '@/components';

function getFileTypeColor(type: string) {
  switch (type) {
    case 'pdf': return 'text-red-400 bg-red-400/10';
    case 'docx': case 'doc': return 'text-blue-400 bg-blue-400/10';
    case 'pptx': case 'ppt': return 'text-orange-400 bg-orange-400/10';
    default: return 'text-muted-foreground bg-muted';
  }
}

function getMimeTypeShort(mime: string | null): string {
  if (!mime) return 'file';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('docx')) return 'docx';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'pptx';
  if (mime.includes('image')) return 'img';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'xls';
  return 'file';
}

// Recently Added Widget
export function RecentlyAddedWidget() {
  const { data: docs, loading } = useRecentDocuments(5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Tài liệu gần đây</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
          Xem tất cả <ArrowUpRight className="size-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : !docs || docs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chưa có tài liệu nào</div>
        ) : (
          docs.map((doc) => {
            const fileType = getMimeTypeShort(doc.mime_type);
            return (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getFileTypeColor(fileType)}`}>
                  <FileText className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{(doc as any).subjects?.name ?? 'Chưa phân loại'}</span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{formatFileSize(Number(doc.file_size) || 0)}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(doc.created_at)}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Quick Upload Widget
export function QuickUploadWidget() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <Card
        className="border-dashed border-2 border-primary/20 bg-primary/[0.02] hover:border-primary/40 hover:bg-primary/[0.04] transition-all cursor-pointer group"
        onClick={() => setUploadOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="rounded-2xl bg-primary/10 p-4 group-hover:bg-primary/15 transition-colors">
            <Upload className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Kéo thả hoặc nhấp để tải lên</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, IMG - Tối đa 50MB</p>
          </div>
        </CardContent>
      </Card>
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}

// Upcoming Deadlines Widget (placeholder — no backend table yet)
export function DeadlinesWidget() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          Deadline sắp tới
        </CardTitle>
        <Badge variant="outline" className="text-[10px]">Sắp có</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Calendar className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có deadline nào</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Tính năng sẽ được cập nhật sớm</p>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Suggestions Widget (placeholder — no backend AI yet)
export function AISuggestionsWidget() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          Gợi ý từ AI
        </CardTitle>
        <Badge variant="lime" className="text-[10px]">Smart</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Bot className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có gợi ý nào</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">AI sẽ phân tích khi bạn có nhiều tài liệu hơn</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Study Progress Widget - shows docs per subject
export function StudyProgressWidget() {
  const { data: subjectData, loading } = useDocumentsBySubject();

  const COLORS = ['#01FF80', '#01CC66', '#33FFB3', '#00994D', '#66FFD5', '#007A3D'];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Tài liệu theo môn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : !subjectData || subjectData.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          subjectData.slice(0, 5).map((item, i) => {
            const maxDocs = subjectData[0]?.docs ?? 1;
            const percent = Math.round((item.docs / maxDocs) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.docs} tài liệu</span>
                  </div>
                </div>
                <Progress value={percent} className="h-1.5" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Storage Usage Bar Widget
export function StorageUsageWidget() {
  const { data: storageStats, loading } = useStorageStats();

  const STORAGE_CONFIG: Record<string, { name: string; quota: number; color: string }> = {
    SUPABASE: { name: 'Supabase', quota: 500 * 1024 * 1024, color: '#01FF80' },
    GDRIVE: { name: 'Google Drive', quota: 15 * 1024 * 1024 * 1024, color: '#01CC66' },
    CLOUDINARY: { name: 'Cloudinary', quota: 1000 * 1024 * 1024, color: '#33FFB3' },
  };

  const storageTypes = storageStats
    ? Object.entries(storageStats).map(([type, s]) => ({
        name: STORAGE_CONFIG[type]?.name ?? type,
        used: s.totalBytes,
        quota: STORAGE_CONFIG[type]?.quota ?? 500 * 1024 * 1024,
        color: STORAGE_CONFIG[type]?.color ?? '#71717a',
      }))
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Dung lượng lưu trữ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          storageTypes.map((storage) => {
            const percent = Math.round((storage.used / storage.quota) * 100);
            return (
              <div key={storage.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: storage.color }} />
                    <span className="text-sm">{storage.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(storage.used)} / {formatFileSize(storage.quota)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: storage.color }}
                  />
                </div>
                {percent > 80 && (
                  <p className="text-[11px] text-warning flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Gần đầy quota
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
