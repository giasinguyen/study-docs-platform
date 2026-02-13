'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, Shield, Bell, Palette, Globe, HardDrive, LogOut, Save } from 'lucide-react';
import { ThemeToggle } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/routing';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SupabaseUser;
}

export function ProfileSettingsModal({ open, onOpenChange, user }: ProfileSettingsModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [displayName, setDisplayName] = useState(user.user_metadata?.full_name || '');
  const [bio, setBio] = useState(user.user_metadata?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '');

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 2MB');
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Generate unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage (avatars bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        if (uploadError.message?.includes('row-level security')) {
          alert(
            'Lỗi cấu hình Storage. Vui lòng liên hệ quản trị viên để cấu hình RLS policies.\n\n' +
            'Hướng dẫn: Xem file SUPABASE_STORAGE_SETUP.md trong thư mục gốc.'
          );
        } else if (uploadError.message?.includes('not found')) {
          alert(
            'Bucket "avatars" chưa được tạo.\n\n' +
            'Vui lòng tạo bucket "avatars" trong Supabase Dashboard → Storage.\n' +
            'Xem file SUPABASE_STORAGE_SETUP.md để biết chi tiết.'
          );
        } else {
          alert(`Lỗi khi tải lên: ${uploadError.message}`);
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        console.error('Update user error:', updateError);
        alert(`Lỗi khi cập nhật thông tin: ${updateError.message}`);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Error already handled above with specific messages
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
      },
    });

    if (!error) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="size-5 text-primary" />
            Hồ sơ & Cài đặt
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="gap-2">
                <User className="size-4" />
                Hồ sơ
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="size-4" />
                Cài đặt
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-6 pb-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              {/* Avatar & Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
                  <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl} alt={displayName || 'Avatar'} />
                      )}
                      <AvatarFallback className="text-2xl font-semibold bg-linear-to-br from-primary/20 to-primary/5">
                        {displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG hoặc GIF. Tối đa 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user.email || ''} 
                      disabled 
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email không thể thay đổi
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị</Label>
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên của bạn"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu</Label>
                    <textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Giới thiệu ngắn về bạn..."
                      rows={3}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="size-4 text-primary" />
                    Thông tin tài khoản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">ID tài khoản</span>
                    <span className="text-sm font-mono">{user.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Ngày tạo</span>
                    <span className="text-sm">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Đăng nhập lần cuối</span>
                    <span className="text-sm">{new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="size-4 text-primary" />
                    Giao diện
                  </CardTitle>
                  <CardDescription>Tùy chỉnh giao diện ứng dụng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Chế độ sáng/tối</Label>
                      <p className="text-xs text-muted-foreground">Chọn theme cho ứng dụng</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </CardContent>
              </Card>

              {/* Language */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    Ngôn ngữ
                  </CardTitle>
                  <CardDescription>Chọn ngôn ngữ hiển thị</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ngôn ngữ hiển thị</Label>
                      <p className="text-xs text-muted-foreground">
                        Hiện tại: Tiếng Việt
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="size-4 text-primary" />
                    Thông báo
                  </CardTitle>
                  <CardDescription>Quản lý tùy chọn thông báo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email thông báo</Label>
                      <p className="text-xs text-muted-foreground">Nhận thông báo qua email</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        emailNotifications ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push notifications</Label>
                      <p className="text-xs text-muted-foreground">Nhận thông báo đẩy</p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        pushNotifications ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${
                          pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Storage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="size-4 text-primary" />
                    Dung lượng lưu trữ
                  </CardTitle>
                  <CardDescription>Thông tin sử dụng storage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Supabase Storage</span>
                    <span className="text-sm font-medium">32.6 MB / 500 MB</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '6.5%' }} />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/storage">Xem chi tiết</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Vùng nguy hiểm</CardTitle>
                  <CardDescription>Các hành động không thể hoàn tác</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4 mr-2" />
                    Đăng xuất khỏi tất cả thiết bị
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled
                  >
                    Xóa tài khoản vĩnh viễn
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu của bạn
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveProfile} disabled={loading}>
            <Save className="size-4 mr-2" />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
