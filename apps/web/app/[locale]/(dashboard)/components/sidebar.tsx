'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Star,
  Trash2,
  Search,
  BarChart3,
  Bot,
  HardDrive,
  Calendar,
  Network,
  Shield,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Logo, UploadModal } from '@/components';

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const mainNav: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-4" /> },
    { key: 'documents', href: '/documents', icon: <FileText className="size-4" /> },
    { key: 'semesters', href: '/semesters', icon: <GraduationCap className="size-4" /> },
    { key: 'starred', href: '/starred', icon: <Star className="size-4" /> },
  ];

  const toolsNav: NavItem[] = [
    { key: 'search', href: '/search', icon: <Search className="size-4" /> },
    { key: 'insights', href: '/insights', icon: <BarChart3 className="size-4" /> },
    { key: 'ai-tools', href: '/ai-tools', icon: <Bot className="size-4" /> },
    { key: 'planner', href: '/planner', icon: <Calendar className="size-4" /> },
  ];

  const systemNav: NavItem[] = [
    { key: 'storage', href: '/storage', icon: <HardDrive className="size-4" /> },
    { key: 'knowledge-graph', href: '/knowledge-graph', icon: <Network className="size-4" /> },
    { key: 'security', href: '/security', icon: <Shield className="size-4" /> },
    { key: 'trash', href: '/trash', icon: <Trash2 className="size-4" /> },
  ];

  function NavLink({ item }: { item: NavItem }) {
    const isActive = item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href);

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group',
          isActive
            ? 'bg-primary/10 text-primary font-medium border border-primary/20'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <span className={cn(
          'transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}>
          {item.icon}
        </span>
        {t(`nav.${item.key}`)}
        {item.badge && (
          <span className="ml-auto text-[10px] font-medium bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-lime flex items-center justify-center">
            <FileText className="size-4 text-black" />
          </div>
          <span className="font-bold text-foreground">StudyDocs</span>
        </Link>
      </div>

      {/* Quick Upload */}
      <div className="px-3 pt-3">
        <Button
          variant="lime"
          className="w-full justify-center gap-2 shadow-lg shadow-primary/20"
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="size-4" />
          {t('common.upload')}
        </Button>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={() => window.location.reload()}
      />

      <ScrollArea className="flex-1 px-3 py-3">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </p>
          {mainNav.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </div>

        <Separator className="my-3" />

        {/* Tools */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tools
          </p>
          {toolsNav.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </div>

        <Separator className="my-3" />

        {/* System */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            System
          </p>
          {systemNav.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </div>
      </ScrollArea>

      {/* Storage Info */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{t('dashboard.storageUsed')}</span>
          <span className="text-xs font-medium text-primary">15%</span>
        </div>
        <Progress value={15} className="h-1.5 mb-1.5" />
        <p className="text-[11px] text-muted-foreground">150 MB / 1 GB</p>
      </div>
    </aside>
  );
}
