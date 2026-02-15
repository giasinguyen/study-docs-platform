'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Clock,
  BookOpen,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { useDocumentsBySubject, useDocuments, useSubjects } from '@/lib/hooks';
import { useMemo } from 'react';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const { data: subjectData, loading: subjectLoading } = useDocumentsBySubject();
  const { data: allDocs, loading: docsLoading } = useDocuments();
  const { data: subjects, loading: subjectsLoading } = useSubjects();

  const totalDocs = allDocs?.length ?? 0;

  // Storage type distribution (all files are in Supabase currently)
  const storageDistribution = useMemo(() => {
    if (!allDocs || allDocs.length === 0) return [];
    return [{
      name: 'Supabase',
      value: allDocs.length,
      color: '#01FF80',
    }];
  }, [allDocs]);

  const loading = subjectLoading || docsLoading || subjectsLoading;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Study Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">Phân tích chi tiết hoạt động học tập và sử dụng tài liệu</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : totalDocs}</p>
              <p className="text-xs text-muted-foreground">Tổng tài liệu</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : subjects?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tổng môn học</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-info/10 p-2.5">
              <TrendingUp className="size-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : (subjectData?.length ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Môn có tài liệu</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-2.5">
              <AlertTriangle className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : Math.max(0, (subjects?.length ?? 0) - (subjectData?.length ?? 0))}</p>
              <p className="text-xs text-muted-foreground">Môn chưa có tài liệu</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList>
          <TabsTrigger value="subjects">Theo môn học</TabsTrigger>
          <TabsTrigger value="storage">Theo storage</TabsTrigger>
          <TabsTrigger value="progress">Tiến độ</TabsTrigger>
        </TabsList>

        {/* By Subject Tab */}
        <TabsContent value="subjects" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tài liệu theo môn học</CardTitle>
                <CardDescription>Số lượng tài liệu mỗi môn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải...</div>
                  ) : !subjectData || subjectData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Chưa có dữ liệu</div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="docs" fill="#01FF80" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân bố theo storage</CardTitle>
                <CardDescription>Tài liệu theo loại storage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {loading ? (
                    <span className="text-sm text-muted-foreground">Đang tải...</span>
                  ) : storageDistribution.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Chưa có dữ liệu</span>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={storageDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {storageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6">
                  {storageDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết tài liệu theo môn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Đang tải...</div>
              ) : (
                (subjectData ?? []).map((subject, i) => (
                  <div key={subject.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                    </div>
                    <Badge variant="lime" className="text-[10px]">{subject.docs} tài liệu</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tỉ lệ tài liệu theo môn</CardTitle>
              <CardDescription>So sánh số lượng tài liệu giữa các môn học</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Đang tải...</div>
              ) : (
                (subjectData ?? []).map((subject) => {
                  const maxDocs = subjectData?.[0]?.docs ?? 1;
                  const percent = Math.round((subject.docs / maxDocs) * 100);
                  return (
                    <div key={subject.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{subject.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{subject.docs} tài liệu ({percent}%)</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
