'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ThemeToggle, LanguageSwitcher } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, Settings, LogOut, User, Command } from 'lucide-react';
import { ProfileSettingsModal } from './profile-settings-modal';
import { NotificationCenter } from './notification-center';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  user: SupabaseUser;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài liệu... (⌘K)"
            className="pl-9 pr-12 bg-muted/50 border-transparent hover:border-border focus-visible:border-primary/50 focus-visible:bg-background h-9"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            <Command className="size-3" />K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <NotificationCenter />

        <LanguageSwitcher />
        <ThemeToggle />
        
        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <Avatar className="w-7 h-7">
              {user.user_metadata?.avatar_url && (
                <AvatarImage src={user.user_metadata.avatar_url} alt="Avatar" />
              )}
              <AvatarFallback className="text-[11px]">
                {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 p-1 animate-in fade-in-0 zoom-in-95">
                <div className="px-3 py-2.5 border-b border-border mb-1">
                  <p className="text-sm font-medium truncate">{user.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setProfileModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground rounded-lg cursor-pointer transition-colors hover:bg-accent"
                >
                  <User className="size-4 text-muted-foreground" />
                  Hồ sơ
                </button>
                <button 
                  onClick={() => {
                    setProfileModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground rounded-lg cursor-pointer transition-colors hover:bg-accent"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Cài đặt
                </button>
                <div className="h-px bg-border my-1" />
                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive rounded-lg cursor-pointer transition-colors hover:bg-destructive/10">
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ProfileSettingsModal 
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={user}
      />
    </header>
  );
}
