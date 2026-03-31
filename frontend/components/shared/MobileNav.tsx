'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FolderOpen, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { href: '/chat',      icon: MessageSquare,   label: 'Chat'     },
  { href: '/projects',  icon: FolderOpen,      label: 'Projects' },
  { href: '/settings',  icon: Settings,        label: 'Settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8E0D6] safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn('flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all',
                active ? 'text-[#8B5E3C]' : 'text-[#A89585] hover:text-[#6B5D52]')}>
              <div className={cn('p-1.5 rounded-xl transition-all', active && 'bg-[#EDE8E2]')}>
                <Icon className={cn('w-5 h-5', active && 'text-[#C4A484]')} />
              </div>
              <span className={cn('text-[10px] font-semibold', active ? 'text-[#8B5E3C]' : 'text-[#A89585]')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
