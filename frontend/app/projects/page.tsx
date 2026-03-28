'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Search, Download,
  Trash2, Globe, Bot, Zap, Database, Code2, Package, X
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { FileTree } from '@/components/file-manager/FileTree';
import { FileViewer } from '@/components/file-manager/FileViewer';
import { ProjectPreview } from '@/components/file-manager/ProjectPreview';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { exportApi } from '@/lib/api';
import { cn, formatDate, truncate } from '@/lib/utils';
import type { Project, ProjectFile } from '@/store/projectStore';

const TYPE_ICONS: Record<string, React.ElementType> = {
  web: Globe, 'whatsapp-bot': Bot, automation: Zap,
  api: Database, fullstack: Code2, other: Package,
};

type RightTab = 'files' | 'preview';

function CreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (n: string, d: string, t: string) => Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('web');
  const [loading, setLoading] = useState(false);

  const types = [
    { value: 'web',           label: 'Web App',       icon: Globe     },
    { value: 'whatsapp-bot',  label: 'WhatsApp Bot',  icon: Bot       },
    { value: 'automation',    label: 'Automation',     icon: Zap       },
    { value: 'api',           label: 'API',            icon: Database  },
    { value: 'fullstack',     label: 'Full Stack',     icon: Code2     },
    { value: 'other',         label: 'Other',          icon: Package   },
  ];

  const handle = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), desc.trim(), type);
      onClose();
    } catch (err) {
      console.error('Create project failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-white border border-[#E8E0D6] rounded-3xl p-6 w-full max-w-md shadow-soft-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[#1A1410]">New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#F5F2EF] text-[#A89585] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">
              Project Name *
            </label>
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl px-4 py-3 text-sm text-[#1A1410] placeholder-[#A89585] focus:outline-none focus:border-[#C4A484] transition"
              placeholder="My Awesome App"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl px-4 py-3 text-sm text-[#1A1410] placeholder-[#A89585] focus:outline-none focus:border-[#C4A484] transition resize-none"
              placeholder="What are you building?"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6B5D52] block mb-2 uppercase tracking-wider">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {types.map((t) => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition',
                    type === t.value
                      ? 'border-[#C4A484] bg-[#FAFAF8] text-[#8B5E3C]'
                      : 'border-[#E8E0D6] text-[#6B5D52] hover:border-[#C4A484] hover:bg-[#FAFAF8]'
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handle} disabled={loading || !name.trim()}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    projects, loadProjects, createProject, deleteProject,
    loadFiles, activeProjectId, setActiveProject,
    projectFiles, activeFilePath, setActiveFile,
  } = useProjects();

  const [search,     setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [rightTab,   setRightTab]   = useState<RightTab>('files');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  useEffect(() => {
    if (activeProjectId) loadFiles(activeProjectId);
  }, [activeProjectId]);

  if (authLoading || !user) return <PageLoader />;

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const files = activeProjectId ? (projectFiles[activeProjectId] || []) : [];
  const activeFile = files.find((f) => f.filePath === activeFilePath) || null;

  const handleSelectFile = (file: ProjectFile) => setActiveFile(file.filePath);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8]">
      {/* Sidebar */}
      <div className="hidden md:flex shrink-0"><Sidebar /></div>

      {/* Left panel — project list */}
      <div className="w-72 shrink-0 bg-white border-r border-[#E8E0D6] flex flex-col">
        <div className="p-4 border-b border-[#E8E0D6]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-base font-bold text-[#1A1410]">Projects</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#C4A484] hover:text-[#8B5E3C] transition"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A89585]" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl pl-8 pr-3 py-2 text-xs text-[#1A1410] placeholder-[#A89585] focus:outline-none focus:border-[#C4A484] transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-8 h-8 text-[#E8E0D6] mx-auto mb-3" />
              <p className="text-xs text-[#A89585] mb-3">No projects yet</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs px-4 py-2">
                <Plus className="w-3 h-3" /> Create Project
              </button>
            </div>
          ) : filtered.map((project) => {
            const Icon = TYPE_ICONS[project.type] || Package;
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                onClick={() => setActiveProject(project.id)}
                className={cn(
                  'group flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all',
                  isActive
                    ? 'bg-[#F5F2EF] border border-[#C4A484]'
                    : 'hover:bg-[#FAFAF8] border border-transparent hover:border-[#E8E0D6]'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  isActive ? 'bg-[#dcc9b0]' : 'bg-[#F5F2EF]'
                )}>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#C4A484]' : 'text-[#8B7B6B]')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1410] truncate">{truncate(project.name, 22)}</p>
                  <p className="text-[11px] text-[#A89585] mt-0.5">{formatDate(project.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-[#A89585] hover:text-red-500 transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — files + preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8]">
        {activeProject ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-[#E8E0D6] px-5 py-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-display text-base font-bold text-[#1A1410]">{activeProject.name}</h2>
                <p className="text-xs text-[#A89585]">{activeProject.type} · {files.length} files</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-[#F5F2EF] rounded-xl p-0.5">
                  {(['files','preview'] as RightTab[]).map((tab) => (
                    <button key={tab} onClick={() => setRightTab(tab)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition',
                        rightTab === tab ? 'bg-white text-[#1A1410] shadow-soft-sm' : 'text-[#8B7B6B]'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportApi.downloadZip(activeProject.id, activeProject.name)}
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {rightTab === 'files' ? (
                <>
                  <div className="w-52 shrink-0 bg-white border-r border-[#E8E0D6] overflow-y-auto">
                    <FileTree
                      files={files}
                      activeFilePath={activeFilePath}
                      onSelectFile={handleSelectFile}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {activeFile ? (
                      <FileViewer file={activeFile} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <FolderOpen className="w-10 h-10 text-[#E8E0D6] mx-auto mb-3" />
                          <p className="text-sm font-semibold text-[#1A1410] mb-1">Select a file</p>
                          <p className="text-xs text-[#A89585]">Choose a file from the tree to view it</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1">
                  <ProjectPreview
                    files={files}
                    previewUrl={activeProject.previewUrl || null}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#F5F2EF] flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-[#C4A484]" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#1A1410] mb-2">Select a Project</h2>
              <p className="text-sm text-[#8B7B6B] mb-6">Choose a project to view files and preview your app.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-3 flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Create Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreate={createProject}
          />
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
