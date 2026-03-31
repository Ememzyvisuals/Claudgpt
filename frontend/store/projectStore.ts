import { create } from 'zustand';
export interface Project { id: string; name: string; description: string; type: string; status: string; techStack: string[]; createdAt: string; updatedAt: string; previewUrl?: string; }
export interface ProjectFile { id: string; projectId: string; filePath: string; content: string; language: string; }
interface ProjectState {
  projects: Project[]; activeProjectId: string | null; projectFiles: Record<string, ProjectFile[]>; activeFilePath: string | null;
  setProjects: (p: Project[]) => void; addProject: (p: Project) => void; removeProject: (id: string) => void; setActiveProject: (id: string | null) => void;
  setProjectFiles: (pid: string, files: ProjectFile[]) => void; upsertFile: (pid: string, file: ProjectFile) => void; setActiveFilePath: (path: string | null) => void;
  getActiveProject: () => Project | null; getActiveFile: () => ProjectFile | null;
}
export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [], activeProjectId: null, projectFiles: {}, activeFilePath: null,
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id), activeProjectId: s.activeProjectId === id ? null : s.activeProjectId })),
  setActiveProject: (id) => set({ activeProjectId: id, activeFilePath: null }),
  setProjectFiles: (pid, files) => set((s) => ({ projectFiles: { ...s.projectFiles, [pid]: files } })),
  upsertFile: (pid, file) => set((s) => { const existing = s.projectFiles[pid] || []; const idx = existing.findIndex((f) => f.filePath === file.filePath); const updated = idx >= 0 ? existing.map((f, i) => i === idx ? file : f) : [...existing, file]; return { projectFiles: { ...s.projectFiles, [pid]: updated } }; }),
  setActiveFilePath: (path) => set({ activeFilePath: path }),
  getActiveProject: () => { const { projects, activeProjectId } = get(); return projects.find((p) => p.id === activeProjectId) || null; },
  getActiveFile: () => { const { projectFiles, activeProjectId, activeFilePath } = get(); if (!activeProjectId || !activeFilePath) return null; return (projectFiles[activeProjectId] || []).find((f) => f.filePath === activeFilePath) || null; },
}));
