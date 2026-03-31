'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

export function LoadingSpinner({ size = 'md', className, label }: { size?: 'sm'|'md'|'lg'; className?: string; label?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn(sizes[size], 'rounded-full border-2 border-gray-100 border-t-gray-400 animate-spin')} />
      {label && <p className="text-sm text-[#8B7B6B] font-medium">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = 'Loading ClaudGPT...' }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center fixed inset-0 z-50">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5">
        <Logo size="lg" />
        <LoadingSpinner size="md" label={label} />
      </motion.div>
    </div>
  );
}
