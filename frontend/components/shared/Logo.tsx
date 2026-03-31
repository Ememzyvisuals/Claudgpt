'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;  // for dark backgrounds
}

export function Logo({ size = 'md', href, className, showWordmark = true, inverted = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, font: 'text-base',  gap: 'gap-2'   },
    md: { icon: 36, font: 'text-xl',    gap: 'gap-2.5' },
    lg: { icon: 48, font: 'text-3xl',   gap: 'gap-3'   },
  };
  const { icon, font, gap } = sizes[size];

  const content = (
    <span className={cn('flex items-center', gap, className)}>
      {/* SVG Icon */}
      <svg width={icon} height={icon} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="logoGradBrown" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4A484" />
            <stop offset="100%" stopColor="#8B7B6B" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="11" fill="url(#logoGradBrown)" />
        <rect x="2" y="2" width="40" height="40" rx="9.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {/* C letterform */}
        <path d="M28 12 C22 12 15 16 15 22 C15 28 22 32 28 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M28 12 L28 15.5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M28 28.5 L28 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Spark accent */}
        <path d="M23.5 17.5 L20.5 23 L23.5 23 L20 28.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>

      {showWordmark && (
        <span className={cn('font-display font-bold tracking-tight leading-none', font)}>
          <span className={inverted ? 'text-white' : 'text-[#1A1410]'}>Claud</span>
          <span style={{ color: '#C4A484' }}>GPT</span>
        </span>
      )}
    </span>
  );

  if (href) return (
    <Link href={href} className="inline-flex items-center hover:opacity-85 transition-opacity">{content}</Link>
  );
  return content;
}

export function LogoIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="ClaudGPT">
      <defs>
        <linearGradient id="iconGradBrown2" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C4A484" />
          <stop offset="100%" stopColor="#8B7B6B" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill="url(#iconGradBrown2)" />
      <rect x="2" y="2" width="40" height="40" rx="9.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <path d="M28 12 C22 12 15 16 15 22 C15 28 22 32 28 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M28 12 L28 15.5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M28 28.5 L28 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M23.5 17.5 L20.5 23 L23.5 23 L20 28.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
