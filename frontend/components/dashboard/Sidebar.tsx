'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FolderOpen, LayoutDashboard,
  Settings, LogOut, Plus, ChevronLeft,
  ChevronRight, Trash2
} from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { Logo, LogoIcon } from '@/components/shared/Logo';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat',      href: '/chat',      icon: MessageSquare   },
  { label: 'Projects',  href: '/projects',  icon: FolderOpen      },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { signOut } = useAuth();
  const { user, clear } = useAuthStore();
  const { sessions, activeSessionId } = useChatStore();
  const { createSession, deleteSession, switchSession } = useChat();

  const handleLogout    = async () => { await signOut(); clear(); router.push('/login'); };
  const handleNewChat   = async () => { await createSession('New Chat'); router.push('/chat'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-[#FAFAF8] border-r border-[#E8E0D6] flex flex-col relative shrink-0 overflow-hidden"
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-white border border-[#E8E0D6] rounded-full flex items-center justify-center text-[#8B7B6B] hover:text-[#C4A484] hover:border-[#C4A484] shadow-sm transition-all"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div className={cn('h-16 flex items-center border-b border-[#E8E0D6] px-4 shrink-0', collapsed ? 'justify-center' : 'gap-2.5')}>
        {collapsed ? <LogoIcon size={30} /> : <Logo size="sm" />}
      </div>

      {/* New Chat */}
      <div className={cn('px-3 py-3 shrink-0', collapsed && 'flex justify-center')}>
        <button
          onClick={handleNewChat}
          className={cn(
            'flex items-center gap-2 text-white font-medium text-sm rounded-2xl transition-all duration-200',
            'bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5',
            collapsed ? 'p-2.5' : 'px-4 py-2.5 w-full'
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1 shrink-0">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center rounded-2xl transition-all duration-200 text-sm font-medium',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5',
                active
                  ? 'bg-[#EDE8E2] text-[#8B5E3C] border border-[#C4A484]'
                  : 'text-[#6B5D52] hover:text-[#1A1410] hover:bg-[#EDE8E2]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active && 'text-[#C4A484]')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Chat history */}
      {!collapsed && sessions.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 mt-5 min-h-0">
          <p className="text-[10px] text-[#A89585] uppercase tracking-[0.15em] font-semibold px-1 mb-2.5">
            Recent Chats
          </p>
          <div className="space-y-0.5">
            {sessions.slice(0, 25).map((session) => (
              <div key={session.id}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-all text-sm',
                  activeSessionId === session.id
                    ? 'bg-[#EDE8E2] text-[#8B5E3C] font-medium'
                    : 'text-[#8B7B6B] hover:text-[#1A1410] hover:bg-[#EDE8E2]'
                )}
                onClick={() => { switchSession(session.id); router.push('/chat'); }}
              >
                <span className="truncate text-xs font-medium">{truncate(session.title, 26)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition shrink-0 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="mt-auto border-t border-[#E8E0D6] p-3 space-y-1 shrink-0">
        <Link href="/settings"
          className={cn('flex items-center rounded-xl text-[#6B5D52] hover:text-[#1A1410] hover:bg-[#EDE8E2] transition text-sm font-medium', collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5')}>
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {user && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-[#E8E0D6]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {(user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1A1410] truncate">
                {user.user_metadata?.full_name || truncate(user.email || '', 18)}
              </p>
              <p className="text-[10px] text-[#A89585] truncate">{truncate(user.email || '', 22)}</p>
            </div>
          </div>
        )}

        <button onClick={handleLogout}
          className={cn('flex items-center rounded-xl text-[#8B7B6B] hover:text-red-500 hover:bg-red-50 transition text-sm font-medium w-full', collapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5')}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
