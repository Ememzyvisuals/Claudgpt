'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, ExternalLink, Monitor,
  Tablet, Smartphone, AlertCircle,
  Globe, Code2, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/store/projectStore';

interface ProjectPreviewProps {
  previewUrl?:  string | null;
  projectName:  string;
  files?:       ProjectFile[];   // for live HTML preview
}

type Viewport = 'desktop' | 'tablet' | 'mobile';
type PreviewMode = 'url' | 'html';

const VIEWPORTS: Record<Viewport, { width: string; label: string; icon: React.ElementType }> = {
  desktop: { width: '100%',   label: 'Desktop', icon: Monitor    },
  tablet:  { width: '768px',  label: 'Tablet',  icon: Tablet     },
  mobile:  { width: '375px',  label: 'Mobile',  icon: Smartphone },
};

// ── Build a preview HTML from project files ──────────────────
function buildLivePreview(files: ProjectFile[]): string | null {
  const indexHtml = files.find(
    (f) => f.filePath.endsWith('index.html') ||
           f.filePath === 'public/index.html' ||
           f.filePath === 'src/index.html'
  );
  if (!indexHtml) return null;

  let html = indexHtml.content;

  // Inline CSS files
  const cssFiles = files.filter((f) =>
    f.filePath.endsWith('.css') && !f.filePath.includes('node_modules')
  );
  for (const css of cssFiles) {
    const filename = css.filePath.split('/').pop();
    // Replace <link href="...filename..."> with inline <style>
    html = html.replace(
      new RegExp(`<link[^>]+href=["'][^"']*${filename}["'][^>]*>`, 'i'),
      `<style>${css.content}</style>`
    );
  }

  // Inline JS files (non-module, non-bundle)
  const jsFiles = files.filter((f) =>
    (f.filePath.endsWith('.js') || f.filePath.endsWith('.mjs')) &&
    !f.filePath.includes('node_modules') &&
    !f.filePath.includes('dist/') &&
    !f.filePath.includes('bundle') &&
    !f.filePath.includes('min.js')
  );
  for (const js of jsFiles) {
    const filename = js.filePath.split('/').pop();
    html = html.replace(
      new RegExp(`<script[^>]+src=["'][^"']*${filename}["'][^>]*></script>`, 'i'),
      `<script>${js.content}</script>`
    );
  }

  return html;
}

export function ProjectPreview({
  previewUrl,
  projectName,
  files = [],
}: ProjectPreviewProps) {
  const [viewport,  setViewport]  = useState<Viewport>('desktop');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(false);
  const [mode,      setMode]      = useState<PreviewMode>(previewUrl ? 'url' : 'html');
  const [urlInput,  setUrlInput]  = useState(previewUrl || '');
  const [activeUrl, setActiveUrl] = useState(previewUrl || '');
  const [copied,    setCopied]    = useState(false);
  const [key,       setKey]       = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const liveHtml   = buildLivePreview(files);
  const hasHtmlPreview = liveHtml !== null;
  const hasUrlPreview  = !!activeUrl;

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    setKey((k) => k + 1);
  }, []);

  const copyUrl = useCallback(async () => {
    if (!activeUrl) return;
    await navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeUrl]);

  // ── Empty state ───────────────────────────────────────────
  if (!hasUrlPreview && !hasHtmlPreview) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d14] text-center px-8 py-12">
        <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
          <Globe className="w-7 h-7 text-gray-600" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">No Preview Available</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          Deploy your project to get a live URL, or make sure your project has an <code className="text-violet-400">index.html</code> for a local preview.
        </p>

        {/* URL input */}
        <div className="w-full max-w-sm">
          <p className="text-xs text-gray-500 mb-2">Or paste a live URL to preview:</p>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) { setActiveUrl(urlInput); setMode('url'); } }}
              placeholder="https://your-app.vercel.app"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition font-mono"
            />
            <button
              onClick={() => { if (urlInput) { setActiveUrl(urlInput); setMode('url'); } }}
              disabled={!urlInput}
              className="px-3 py-2 bg-violet-600/20 border border-violet-500/25 text-violet-300 rounded-xl text-xs font-medium transition hover:bg-violet-600/30 disabled:opacity-40"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d14] min-w-0">

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-[#111118] shrink-0 flex-wrap">

        {/* Mode tabs */}
        {hasHtmlPreview && hasUrlPreview && (
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setMode('html')}
              className={cn('px-2.5 py-1 rounded-md text-xs transition', mode === 'html' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}
            >
              Live HTML
            </button>
            <button
              onClick={() => setMode('url')}
              className={cn('px-2.5 py-1 rounded-md text-xs transition', mode === 'url' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}
            >
              Deployed
            </button>
          </div>
        )}

        {/* URL bar */}
        {mode === 'url' && activeUrl && (
          <div className="flex-1 flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 min-w-0">
            <Globe className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-xs text-gray-400 font-mono truncate flex-1">{activeUrl}</span>
            <button onClick={copyUrl} className="shrink-0 p-0.5">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />}
            </button>
          </div>
        )}

        {mode === 'html' && (
          <div className="flex-1 flex items-center gap-1.5 bg-green-500/8 border border-green-500/15 rounded-lg px-3 py-1.5">
            <Code2 className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-xs text-green-400">Live HTML Preview — {projectName}</span>
          </div>
        )}

        {/* Viewport toggles */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 shrink-0">
          {(Object.entries(VIEWPORTS) as [Viewport, typeof VIEWPORTS.desktop][]).map(([vp, { icon: Icon, label }]) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              title={label}
              className={cn('p-1.5 rounded-md transition', viewport === vp ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <button onClick={refresh} title="Refresh" className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
        {mode === 'url' && activeUrl && (
          <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition" title="Open in new tab">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* ── Preview Area ──────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center bg-[#080810] overflow-auto p-4">
        <motion.div
          animate={{ width: VIEWPORTS[viewport].width }}
          transition={{ duration: 0.25 }}
          className="relative bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ minHeight: '500px', height: 'calc(100vh - 160px)', maxWidth: '100%' }}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                <p className="text-xs text-gray-400">Loading preview...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-[#0d0d14] z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-gray-300 font-medium">Preview failed to load</p>
              <p className="text-xs text-gray-500">The URL may be unreachable or blocked by CORS policy.</p>
              <button onClick={refresh} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition">
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          )}

          {/* iframe */}
          {mode === 'html' && liveHtml ? (
            <iframe
              key={`html-${key}`}
              ref={iframeRef}
              srcDoc={liveHtml}
              className="w-full h-full border-0"
              title={`HTML Preview — ${projectName}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          ) : (
            <iframe
              key={`url-${key}-${activeUrl}`}
              ref={iframeRef}
              src={activeUrl}
              className="w-full h-full border-0"
              title={`Preview — ${projectName}`}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
