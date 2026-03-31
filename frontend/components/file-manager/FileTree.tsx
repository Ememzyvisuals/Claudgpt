'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { cn, detectLanguage } from '@/lib/utils';
import type { ProjectFile } from '@/store/projectStore';
interface TreeNode { name: string; path: string; isFile: boolean; language?: string; children?: TreeNode[]; }
function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: Record<string, any> = {};
  for (const file of files) {
    const parts = file.filePath.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]; const isLast = i === parts.length - 1;
      if (!current[part]) current[part] = { name: part, path: parts.slice(0, i + 1).join('/'), isFile: isLast, language: isLast ? detectLanguage(file.filePath) : undefined, children: isLast ? undefined : {} };
      if (!isLast) current = current[part].children;
    }
  }
  const toArray = (obj: Record<string, any>): TreeNode[] =>
    Object.values(obj).map((n) => { const node = n as Record<string, unknown>; return { ...node, children: node.children ? toArray(node.children as Record<string, unknown>) : undefined }; }).sort((a, b) => { const aF = a.isFile as boolean; const bF = b.isFile as boolean; const aN = a.name as string; const bN = b.name as string; return aF === bF ? aN.localeCompare(bN) : aF ? 1 : -1; });
  return toArray(root);
}
function Node({ node, depth, activeFilePath, onSelectFile, onDeleteFile, filesMap }: { node: TreeNode; depth: number; activeFilePath?: string | null; onSelectFile: (f: ProjectFile) => void; onDeleteFile?: (p: string) => void; filesMap: Map<string, ProjectFile> }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isActive = node.isFile && node.path === activeFilePath;
  return (
    <div>
      <div onClick={() => node.isFile ? filesMap.get(node.path) && onSelectFile(filesMap.get(node.path)!) : setExpanded(e => !e)}
        className={cn('group flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition text-sm select-none', isActive ? 'bg-violet-600/20 text-violet-300' : 'text-gray-400 hover:text-white hover:bg-white/5')}
        style={{ paddingLeft: `${8 + depth * 14}px` }}>
        {!node.isFile ? (expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />) : <span className="w-3.5 shrink-0" />}
        {node.isFile ? <File className="w-3.5 h-3.5 shrink-0 text-gray-400" /> : expanded ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-400" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-400/80" />}
        <span className="truncate text-xs flex-1">{node.name}</span>
        {node.isFile && onDeleteFile && <button onClick={(e) => { e.stopPropagation(); onDeleteFile(node.path); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition shrink-0"><Trash2 className="w-3 h-3" /></button>}
      </div>
      {!node.isFile && (
        <AnimatePresence initial={false}>
          {expanded && node.children && node.children.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
              {node.children.map((child) => <Node key={child.path} node={child} depth={depth + 1} activeFilePath={activeFilePath} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} filesMap={filesMap} />)}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
export function FileTree({ files, activeFilePath, onSelectFile, onDeleteFile, onRefresh, isLoading }: { files: ProjectFile[]; activeFilePath?: string | null; onSelectFile: (f: ProjectFile) => void; onDeleteFile?: (p: string) => void; onRefresh?: () => void; isLoading?: boolean }) {
  const tree = buildTree(files);
  const filesMap = new Map(files.map((f) => [f.filePath, f]));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 shrink-0">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Files ({files.length})</span>
        {onRefresh && <button onClick={onRefresh} disabled={isLoading} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-gray-300 transition"><RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} /></button>}
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center"><Folder className="w-8 h-8 text-gray-600 mb-3" /><p className="text-xs text-gray-500">No files yet</p></div>
        ) : (
          tree.map((node) => <Node key={node.path} node={node} depth={0} activeFilePath={activeFilePath} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} filesMap={filesMap} />)
        )}
      </div>
    </div>
  );
}
