'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDocumentsBySubject, useStorageStats, useUploadTimeline } from '@/lib/hooks';
import { formatFileSize } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{payload[0]?.value} tài liệu</p>
      </div>
    );
  }
  return null;
};

export function DocumentsBySubjectChart() {
  const { data: subjectData, loading } = useDocumentsBySubject();

  const chartData = (subjectData ?? []).map((item) => ({
    name: item.name,
    docs: item.docs,
  }));

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Tài liệu theo môn học</CardTitle>
        <CardDescription>Phân bố tài liệu trong các môn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải...</div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(1, 255, 128, 0.05)' }} />
              <Bar dataKey="docs" fill="#01FF80" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StorageDistributionChart() {
  const { data: storageStats, loading } = useStorageStats();

  const STORAGE_COLORS: Record<string, string> = {
    SUPABASE: '#01FF80',
    GDRIVE: '#01CC66',
    CLOUDINARY: '#33FFB3',
  };

  const STORAGE_LABELS: Record<string, string> = {
    SUPABASE: 'Supabase',
    GDRIVE: 'Google Drive',
    CLOUDINARY: 'Cloudinary',
  };

  const storageData = storageStats
    ? Object.entries(storageStats)
        .filter(([, s]) => s.fileCount > 0)
        .map(([type, s]) => ({
          name: STORAGE_LABELS[type] ?? type,
          value: s.totalBytes > 0 ? s.totalBytes : s.fileCount,
          color: STORAGE_COLORS[type] ?? '#71717a',
          files: s.fileCount,
          bytes: s.totalBytes,
        }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dung lượng theo Storage</CardTitle>
        <CardDescription>Phân bố dung lượng lưu trữ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] flex items-center justify-center">
          {loading ? (
            <span className="text-sm text-muted-foreground">Đang tải...</span>
          ) : storageData.length === 0 ? (
            <span className="text-sm text-muted-foreground">Chưa có dữ liệu</span>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={storageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {storageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const entry = payload[0]?.payload as { name: string; bytes: number; files: number } | undefined;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
                        <p className="font-medium">{entry?.name}</p>
                        <p className="text-primary">{formatFileSize(entry?.bytes ?? 0)}</p>
                        <p className="text-muted-foreground text-xs">{entry?.files} tệp</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
        {/* Legend */}
        {storageData.length > 0 && (
        <div className="flex items-center justify-center gap-6 mt-2">
          {storageData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="text-xs font-medium">
                {item.bytes > 0 ? formatFileSize(item.bytes) : `${item.files} tệp`}
              </span>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UploadTimelineChart() {
  const { data: timelineData, loading } = useUploadTimeline(7);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Upload trong tuần</CardTitle>
        <CardDescription>Số tài liệu tải lên 7 ngày gần nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải...</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData ?? []}>
              <defs>
                <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#01FF80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#01FF80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="uploads"
                stroke="#01FF80"
                strokeWidth={2}
                fill="url(#limeGradient)"
                dot={{ fill: '#01FF80', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#01FF80', strokeWidth: 0, r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
