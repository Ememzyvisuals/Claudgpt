'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FolderOpen, LayoutDashboard,
  Settings, LogOut, Plus, Trash2, Menu, X,
  Search, PenSquare
} from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { Logo, LogoIcon } from '@/components/shared/Logo';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects',  href: '/projects',  icon: FolderOpen      },
];

// Shared toggle button used in both sidebar and outside it on mobile
export function SidebarToggle({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-xl',
        'text-[#6B5D52] hover:bg-[#EDE8E2] hover:text-[#1A1410] transition-all',
        className
      )}
      aria-label="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export function Sidebar() {
  const [open,    setOpen]    = useState(false);   // mobile overlay
  const [desktop, setDesktop] = useState(true);    // desktop collapsed state
  const [search,  setSearch]  = useState('');
  const pathname = usePathname();
  const router   = useRouter();
  const { signOut } = useAuth();
  const { user, clear } = useAuthStore();
  const { sessions, activeSessionId } = useChatStore();
  const { createSession, deleteSession, switchSession } = useChat();

  // Close mobile overlay on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleLogout  = async () => { await signOut(); clear(); router.push('/login'); };
  const handleNewChat = async () => {
    const s = await createSession('New Chat');
    router.push('/chat');
    setOpen(false);
  };

  const filteredSessions = search.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  // Sidebar content — shared between mobile and desktop
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#171717] text-white">

      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 shrink-0">
        <Logo size="sm" inverted />
        <button
          onClick={() => { setOpen(false); if (window.innerWidth >= 768) setDesktop(false); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8B8B8B] hover:bg-white/10 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-sm font-medium transition-all group"
        >
          <PenSquare className="w-4 h-4 text-[#C4A484] shrink-0" />
          <span className="flex-1 text-left text-[#E8E0D6]">New Chat</span>
          <Plus className="w-3.5 h-3.5 text-[#6B6B6B] group-hover:text-[#C4A484] transition" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="px-3 space-y-0.5 shrink-0 mb-2">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-[#8B8B8B] hover:bg-white/8 hover:text-white'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      {sessions.length > 3 && (
        <div className="px-3 mb-2 shrink-0">
          <div className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-xs text-white placeholder-[#6B6B6B] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-3 min-h-0">
        {filteredSessions.length > 0 && (
          <>
            <p className="text-[10px] text-[#4B4B4B] uppercase tracking-[0.15em] font-semibold px-1 mb-2">
              Recent
            </p>
            <div className="space-y-0.5">
              {filteredSessions.slice(0, 30).map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-all',
                    activeSessionId === session.id
                      ? 'bg-white/15 text-white'
                      : 'text-[#8B8B8B] hover:bg-white/8 hover:text-white'
                  )}
                  onClick={() => { switchSession(session.id); router.push('/chat'); setOpen(false); }}
                >
                  <span className="truncate text-xs flex-1">
                    {truncate(session.title === 'New Chat' ? 'New conversation' : session.title, 28)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition shrink-0 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom — user + settings */}
      <div className="border-t border-white/8 p-3 space-y-1 shrink-0">
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8B8B8B] hover:bg-white/8 hover:text-white transition text-sm font-medium">
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {(user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#E8E0D6] truncate">
                {user.user_metadata?.full_name || truncate(user.email || '', 18)}
              </p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-red-400 hover:bg-red-500/10 transition" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        {desktop && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden md:flex h-screen shrink-0 overflow-hidden"
          >
            <div className="w-64 h-full">
              <SidebarContent />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop toggle when sidebar is closed ───────── */}
      {!desktop && (
        <div className="hidden md:flex items-center justify-center w-12 h-screen bg-[#171717] shrink-0">
          <button
            onClick={() => setDesktop(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8B8B8B] hover:bg-white/10 hover:text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Mobile overlay ───────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed top-0 left-0 h-full w-72 z-50"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile menu button (top-left of screen) ─────── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm border border-[#E8E0D6] text-[#6B5D52] shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
