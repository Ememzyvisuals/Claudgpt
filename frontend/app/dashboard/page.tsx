'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare, FolderOpen, Zap,
  Plus, Code2, Bot, ArrowRight, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import { useChat } from '@/hooks/useChat';
import { useProjects } from '@/hooks/useProjects';
import { formatDate, truncate } from '@/lib/utils';

const QUICK = [
  { icon: Code2, label: 'Build Web App',  desc: 'Generate a full-stack web application', href: '/chat', color: 'from-[#C4A484] to-[#8B7B6B]' },
  { icon: Bot,   label: 'WhatsApp Bot',   desc: 'Create a WhatsApp automation bot',      href: '/chat', color: 'from-[#8B7B6B] to-[#6d5e51]' },
  { icon: Zap,   label: 'Automation',     desc: 'Build scripts and automation tools',    href: '/chat', color: 'from-[#a8896a] to-[#8B7B6B]' },
];

export default function DashboardPage() {
  const router  = useRouter();
  const { user, loading } = useAuth();
  const { user: storeUser } = useAuthStore();
  const { sessions } = useChatStore();
  const { projects } = useProjectStore();
  const { loadSessions } = useChat();
  const { loadProjects } = useProjects();

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) { loadSessions(); loadProjects(); } }, [user]); // eslint-disable-line

  if (loading || !user) return <PageLoader />;

  const name = storeUser?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer';

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="hidden md:flex shrink-0"><Sidebar /></div>

      <main className="flex-1 overflow-y-auto bg-[#FAFAF8] pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#C4A484] uppercase mb-1">Dashboard</p>
            <h1 className="font-display text-3xl font-bold text-[#1A1410] mb-1">Welcome back, {name}</h1>
            <p className="text-[#8B7B6B] text-sm">What are we shipping today?</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Chat Sessions', value: sessions.length, icon: MessageSquare },
              { label: 'Projects',      value: projects.length, icon: FolderOpen    },
              { label: 'AI Agents',     value: 9,               icon: Zap           },
              { label: 'Active Models', value: 4,               icon: TrendingUp    },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#E8E0D6] rounded-3xl p-5 shadow-soft-sm hover:shadow-soft-md hover:border-[#C4A484]/40 transition-all">
                <div className="w-9 h-9 rounded-2xl bg-[#F5F2EF] flex items-center justify-center mb-3">
                  <s.icon className="w-4 h-4 text-[#C4A484]" />
                </div>
                <p className="font-display text-2xl font-bold text-[#1A1410]">{s.value}</p>
                <p className="text-xs text-[#A89585] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Quick Start */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
            <h2 className="font-display text-lg font-semibold text-[#1A1410] mb-4">Quick Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK.map((a) => (
                <Link key={a.label} href={a.href}>
                  <div className="group bg-white border border-[#E8E0D6] rounded-3xl p-5 hover:border-[#C4A484] hover:shadow-soft-lg transition-all duration-200 cursor-pointer h-full">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3 shadow-primary`}>
                      <a.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-[#1A1410] mb-1 group-hover:text-[#8B5E3C] transition">{a.label}</h3>
                    <p className="text-xs text-[#A89585]">{a.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#C4A484] opacity-0 group-hover:opacity-100 transition">
                      Start <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent — fully typed, no casts needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Recent Chats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-[#1A1410]">Recent Chats</h2>
                <Link href="/chat" className="text-xs text-[#C4A484] hover:text-[#a8896a] transition font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {sessions.length > 0 ? sessions.slice(0, 5).map((session) => (
                  <Link key={session.id} href="/chat">
                    <div className="bg-white border border-[#E8E0D6] rounded-2xl px-4 py-3.5 hover:border-[#C4A484] hover:shadow-soft-md transition-all flex items-center gap-3 group">
                      <MessageSquare className="w-4 h-4 text-[#C4A484] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1410] truncate">{truncate(session.title, 35)}</p>
                        <p className="text-xs text-[#A89585]">{formatDate(session.createdAt)}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E8E0D6] group-hover:text-[#C4A484] transition shrink-0" />
                    </div>
                  </Link>
                )) : (
                  <div className="bg-white border border-[#E8E0D6] rounded-2xl px-4 py-10 text-center">
                    <p className="text-xs text-[#A89585] mb-3">No chats yet</p>
                    <Link href="/chat" className="inline-flex items-center gap-1 text-xs text-[#C4A484] font-semibold hover:text-[#a8896a] transition">
                      <Plus className="w-3 h-3" /> Start a chat
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Projects */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-[#1A1410]">Recent Projects</h2>
                <Link href="/projects" className="text-xs text-[#C4A484] hover:text-[#a8896a] transition font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {projects.length > 0 ? projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href="/projects">
                    <div className="bg-white border border-[#E8E0D6] rounded-2xl px-4 py-3.5 hover:border-[#C4A484] hover:shadow-soft-md transition-all flex items-center gap-3 group">
                      <FolderOpen className="w-4 h-4 text-[#C4A484] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1410] truncate">{truncate(project.name, 35)}</p>
                        <p className="text-xs text-[#A89585]">{project.type} · {project.status}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E8E0D6] group-hover:text-[#C4A484] transition shrink-0" />
                    </div>
                  </Link>
                )) : (
                  <div className="bg-white border border-[#E8E0D6] rounded-2xl px-4 py-10 text-center">
                    <p className="text-xs text-[#A89585] mb-3">No projects yet</p>
                    <Link href="/projects" className="inline-flex items-center gap-1 text-xs text-[#C4A484] font-semibold hover:text-[#a8896a] transition">
                      <Plus className="w-3 h-3" /> Create project
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
