'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Trash2,
  LogIn,
  Monitor,
  Smartphone,
  Globe,
  Key,
  Activity,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDashboardStats } from '@/lib/hooks';
import { formatRelativeTime } from '@/lib/utils';

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: stats } = useDashboardStats();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const lastSignIn = user?.last_sign_in_at
    ? formatRelativeTime(user.last_sign_in_at)
    : 'Không rõ';

  const provider = user?.app_metadata?.provider ?? 'email';
  const emailConfirmed = !!user?.email_confirmed_at;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Giám sát bảo mật và hoạt động tài khoản</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Key className="size-4" /> Đổi mật khẩu
        </Button>
      </div>

      {/* Security Score + Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 sm:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative size-20 mb-3">
              <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={emailConfirmed ? '#01FF80' : '#eab308'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${((emailConfirmed ? 75 : 50) / 100) * 213.6} 213.6`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{emailConfirmed ? 75 : 50}</span>
            </div>
            <p className="text-sm font-medium">Security Score</p>
            <Badge variant={emailConfirmed ? 'success' : 'warning'} className="text-[10px] mt-1">
              {emailConfirmed ? 'Khá' : 'Trung bình'}
            </Badge>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{loading ? '...' : provider}</p>
              <p className="text-xs text-muted-foreground">Phương thức đăng nhập</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Monitor className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : lastSignIn}</p>
              <p className="text-xs text-muted-foreground">Lần đăng nhập cuối</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalDocs}</p>
              <p className="text-xs text-muted-foreground">Tổng tài liệu</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" /> Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Đang tải...</div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Email xác nhận</span>
                  <Badge variant={emailConfirmed ? 'success' : 'warning'} className="text-[10px]">
                    {emailConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium capitalize">{provider}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <code className="text-xs text-muted-foreground font-mono">{user?.id?.slice(0, 12)}…</code>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Tạo lúc</span>
                  <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="size-4 text-warning" /> Đề xuất bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!emailConfirmed && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="size-4 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Xác nhận email</p>
                  <p className="text-[11px] text-muted-foreground">Email chưa được xác nhận. Hãy kiểm tra hộp thư và xác nhận email để bảo vệ tài khoản.</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Eye className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Bật Recovery Email</p>
                <p className="text-[11px] text-muted-foreground">Thêm email phục hồi để bảo vệ tài khoản trong trường hợp mất quyền truy cập.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Key className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Đổi mật khẩu định kỳ</p>
                <p className="text-[11px] text-muted-foreground">Nên thay đổi mật khẩu mỗi 3 tháng để tăng cường bảo mật.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <ShieldCheck className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Bật xác thực 2 bước (2FA)</p>
                <p className="text-[11px] text-muted-foreground">Sử dụng ứng dụng Authenticator để thêm lớp bảo vệ cho tài khoản.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
