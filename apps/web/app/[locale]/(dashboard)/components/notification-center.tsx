'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Upload,
  Sparkles,
  Info,
  Clock,
  HardDrive,
  Check,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { NotificationType } from '@/lib/hooks/use-notifications';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  upload: { icon: Upload, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ai_complete: { icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  system: { icon: Info, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  reminder: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  storage_warning: { icon: HardDrive, color: 'text-red-500', bg: 'bg-red-500/10' },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-popover border border-border rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-primary bg-primary/10 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="size-3.5" />
                    Đọc tất cả
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm('Xóa tất cả thông báo?')) {
                        clearAll();
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Không có thông báo</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Bạn sẽ nhận được thông báo khi có hoạt động mới
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((notification, index) => {
                    const config = typeConfig[notification.type] || typeConfig.system;
                    const Icon = config.icon;

                    return (
                      <div key={notification.id}>
                        <div
                          className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                            !notification.is_read ? 'bg-primary/[0.03]' : ''
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                            if (notification.action_url) {
                              setOpen(false);
                              window.location.href = notification.action_url;
                            }
                          }}
                        >
                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}

                          {/* Icon */}
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center mt-0.5`}>
                            <Icon className={`size-4 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <button
                                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                title="Đánh dấu đã đọc"
                              >
                                <Check className="size-3.5" />
                              </button>
                            )}
                            <button
                              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              title="Xóa thông báo"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        {index < notifications.length - 1 && (
                          <Separator className="mx-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
