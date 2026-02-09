'use client';

import { FileText, GraduationCap, HardDrive, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { useDashboardStats } from '@/lib/hooks';
import {
  StatCard,
  DocumentsBySubjectChart,
  StorageDistributionChart,
  UploadTimelineChart,
  RecentlyAddedWidget,
  QuickUploadWidget,
  DeadlinesWidget,
  AISuggestionsWidget,
  StudyProgressWidget,
  StorageUsageWidget,
} from './components';

export default function DashboardPage() {
  const { data: stats, loading } = useDashboardStats();

  return (
    <div className="space-y-6 fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Tổng quan về kho tài liệu học tập của bạn</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Tổng tài liệu"
          value={loading ? '...' : stats.totalDocs}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          title="Tổng môn học"
          value={loading ? '...' : stats.totalSubjects}
          icon={<GraduationCap className="size-5" />}
        />
        <StatCard
          title="Dung lượng"
          value={loading ? '...' : formatFileSize(stats.totalStorageBytes)}
          icon={<HardDrive className="size-5" />}
        />
        <StatCard
          title="Mới trong 7 ngày"
          value={loading ? '...' : stats.recentWeekDocs}
          icon={<Clock className="size-5" />}
        />
        <StatCard
          title="Chưa phân loại"
          value={loading ? '...' : 0}
          icon={<AlertCircle className="size-5" />}
          subtitle="Cần gắn môn học"
          className="border-warning/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DocumentsBySubjectChart />
        <StorageDistributionChart />
      </div>

      {/* Upload Timeline */}
      <UploadTimelineChart />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1 - Recent & Upload */}
        <div className="space-y-4 lg:col-span-2">
          <QuickUploadWidget />
          <RecentlyAddedWidget />
        </div>

        {/* Column 2 - Side Widgets */}
        <div className="space-y-4">
          <AISuggestionsWidget />
          <DeadlinesWidget />
        </div>
      </div>

      {/* Bottom Row - Study Progress & Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudyProgressWidget />
        <StorageUsageWidget />
      </div>
    </div>
  );
}
