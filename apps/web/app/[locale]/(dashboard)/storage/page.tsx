'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  HardDrive,
  Cloud,
  Image,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useStorageStats, useDocuments } from '@/lib/hooks';
import { formatFileSize } from '@/lib/utils';

const STORAGE_CONFIG: Record<string, { name: string; icon: React.ReactNode; quota: number; color: string }> = {
  SUPABASE: { name: 'Supabase Storage', icon: <Cloud className="size-5" />, quota: 500 * 1024 * 1024, color: '#01FF80' },
  GDRIVE: { name: 'Google Drive', icon: <HardDrive className="size-5" />, quota: 15 * 1024 * 1024 * 1024, color: '#01CC66' },
  CLOUDINARY: { name: 'Cloudinary', icon: <Image className="size-5" />, quota: 1000 * 1024 * 1024, color: '#33FFB3' },
};

export default function StoragePage() {
  const { data: storageStats, loading: statsLoading } = useStorageStats();
  const { data: allDocs, loading: docsLoading } = useDocuments();

  const providers = storageStats
    ? Object.entries(storageStats).map(([type, s]) => {
        const config = STORAGE_CONFIG[type] ?? { name: type, icon: <Cloud className="size-5" />, quota: 500 * 1024 * 1024, color: '#71717a' };
        return {
          type,
          ...config,
          used: s.totalBytes,
          files: s.fileCount,
          status: (s.totalBytes / config.quota) > 0.9 ? 'warning' : 'healthy',
        };
      })
    : [];

  const totalUsed = providers.reduce((acc, p) => acc + p.used, 0);
  const totalFiles = providers.reduce((acc, p) => acc + p.files, 0);

  // Find large files on Supabase that could be moved to GDrive
  const largeFiles = (allDocs ?? [])
    .filter((d) => d.storage_type === 'SUPABASE' && Number(d.file_size) > 5 * 1024 * 1024)
    .sort((a, b) => Number(b.file_size) - Number(a.file_size))
    .slice(0, 5);

  const loading = statsLoading || docsLoading;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý và giám sát dung lượng lưu trữ</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Health Check
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <HardDrive className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : formatFileSize(totalUsed)}</p>
              <p className="text-xs text-muted-foreground">Tổng dung lượng đã dùng</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Cloud className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{providers.length}</p>
              <p className="text-xs text-muted-foreground">Storage Provider</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : totalFiles}</p>
              <p className="text-xs text-muted-foreground">Tổng file trên cloud</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Providers Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          providers.map((provider) => {
            const percent = Math.round((provider.used / provider.quota) * 100);
            return (
              <Card key={provider.name} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: provider.color }} />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.icon}
                      {provider.name}
                    </CardTitle>
                    <Badge variant={provider.status === 'healthy' ? 'success' : 'warning'} className="text-[10px]">
                      {provider.status === 'healthy' ? 'Healthy' : 'Warning'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{formatFileSize(provider.used)} / {formatFileSize(provider.quota)}</span>
                      <span className="font-medium" style={{ color: provider.color }}>{percent}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: provider.color }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{provider.files} files</span>
                    <span>{formatFileSize(provider.quota - provider.used)} còn trống</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Large Files - Migration Suggestion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-warning" /> Đề xuất chuyển storage
          </CardTitle>
          <CardDescription>File lớn trên Supabase có thể chuyển sang Google Drive để tiết kiệm quota</CardDescription>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Đang tải...</div>
          ) : largeFiles.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <CheckCircle2 className="size-5 text-primary mx-auto mb-2" />
              Không có file lớn cần chuyển
            </div>
          ) : (
            <div className="space-y-2">
              {largeFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <AlertTriangle className="size-4 text-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatFileSize(Number(file.file_size))} · Supabase</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <ArrowRightLeft className="size-3" /> Chuyển sang Drive
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
