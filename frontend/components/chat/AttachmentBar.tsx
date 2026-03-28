'use client';

import { X, FileCode, Image, FileText, Github, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import type { Attachment } from '@/lib/attachmentApi';

function Chip({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const icons: Record<string, React.ElementType> = { image: Image, code: FileCode, text: FileText, pdf: File, github: Github };
  const colors: Record<string, string> = {
    image: 'border-pink-200 bg-pink-50 text-pink-700', code: 'border-blue-200 bg-blue-50 text-blue-700',
    text: 'border-[#E8E0D6] bg-[#FAFAF8] text-[#6B5D52]', pdf: 'border-red-200 bg-red-50 text-red-700',
    github: 'border-[#E8E0D6] bg-[#F5F2EF] text-[#1A1410]',
  };
  const Icon = icons[attachment.type] || File;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }}
      className={cn('flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-xs max-w-[200px] shrink-0', colors[attachment.type] || colors.text)}>
      {attachment.type === 'image' && attachment.preview
        ? <img src={attachment.preview} alt={attachment.name} className="w-5 h-5 rounded-md object-cover shrink-0" />
        : <Icon className="w-3.5 h-3.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="truncate leading-none font-medium">{attachment.name}</p>
        {attachment.size && <p className="text-[10px] opacity-60 mt-0.5">{formatBytes(attachment.size)}</p>}
      </div>
      <button onClick={onRemove} className="p-0.5 hover:bg-black/8 rounded-md transition shrink-0"><X className="w-3 h-3" /></button>
    </motion.div>
  );
}

export function AttachmentBar({ attachments, onRemove }: { attachments: Attachment[]; onRemove: (id: string) => void }) {
  if (!attachments.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AnimatePresence>
        {attachments.map((att) => <Chip key={att.id} attachment={att} onRemove={() => onRemove(att.id)} />)}
      </AnimatePresence>
    </div>
  );
}
