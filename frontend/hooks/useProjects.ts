'use client';

import { useCallback } from 'react';
import { projectApi, exportApi } from '@/lib/api';
import { useProjectStore } from '@/store/projectStore';
import type { Project, ProjectFile } from '@/store/projectStore';

function mapProject(raw: Record<string, unknown>): Project {
  return {
    id:          raw.id as string,
    name:        raw.name as string,
    description: (raw.description as string) || '',
    type:        (raw.type as string) || 'web',
    status:      (raw.status as string) || 'active',
    techStack:   (raw.tech_stack || raw.techStack || []) as string[],
    createdAt:   (raw.created_at || raw.createdAt) as string,
    updatedAt:   (raw.updated_at || raw.updatedAt) as string,
  };
}

function mapFile(raw: Record<string, unknown>): ProjectFile {
  return {
    id:        raw.id as string,
    projectId: (raw.project_id || raw.projectId) as string,
    filePath:  (raw.file_path || raw.filePath) as string,
    content:   (raw.content as string) || '',
    language:  (raw.language as string) || 'text',
  };
}

export function useProjects() {
  const {
    projects, activeProjectId, projectFiles, activeFilePath,
    setProjects, addProject, removeProject, setActiveProject,
    setProjectFiles, upsertFile, setActiveFilePath,
    getActiveProject, getActiveFile,
  } = useProjectStore();

  const loadProjects = useCallback(async () => {
    try {
      const { projects } = await projectApi.getAll();
      setProjects((projects as Record<string, unknown>[]).map(mapProject));
    } catch (e) { console.error('loadProjects:', e); }
  }, [setProjects]);

  const createProject = useCallback(async (name: string, description?: string, type?: string) => {
    const { project } = await projectApi.create({ name, description, type });
    const p = mapProject(project as Record<string, unknown>);
    addProject(p);
    setActiveProject(p.id);
    return p;
  }, [addProject, setActiveProject]);

  const deleteProject = useCallback(async (id: string) => {
    await projectApi.delete(id);
    removeProject(id);
  }, [removeProject]);

  const loadFiles = useCallback(async (pid: string) => {
    try {
      const { files } = await projectApi.getFiles(pid);
      setProjectFiles(pid, (files as Record<string, unknown>[]).map(mapFile));
    } catch (e) { console.error('loadFiles:', e); }
  }, [setProjectFiles]);

  const saveFile = useCallback(async (pid: string, filePath: string, content: string, language: string) => {
    const { file } = await projectApi.saveFile(pid, filePath, content, language);
    const f = mapFile(file as Record<string, unknown>);
    upsertFile(pid, f);
    return f;
  }, [upsertFile]);

  const exportZip = useCallback((pid: string, name: string) =>
    exportApi.downloadZip(pid, name), []);
  const exportMarkdown = useCallback((pid: string, name: string) =>
    exportApi.downloadMarkdown(pid, name), []);

  return {
    projects,
    activeProjectId,
    activeProject:  getActiveProject(),
    currentFiles:   activeProjectId ? (projectFiles[activeProjectId] || []) : [],
    activeFilePath,
    activeFile:     getActiveFile(),
    loadProjects, createProject, deleteProject,
    loadFiles, saveFile,
    setActiveProject, setActiveFilePath,
    exportZip, exportMarkdown,
  };
}
