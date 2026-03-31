'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Code2, Zap, Github, Twitter, Facebook, Instagram, Music2 } from 'lucide-react';

const SKILLS = ['AI Systems', 'Full-Stack Dev', 'WhatsApp Bots', 'Automation', 'Node.js', 'Next.js'];

const STATS = [
  { label: 'Projects Built', value: '50+' },
  { label: 'AI Tools Created', value: '12+'  },
  { label: 'Years Building',  value: '5+'   },
];

export function AboutDeveloper() {
  return (
    <section className="py-20 px-6 bg-[#FAFAF8] scroll-mt-16">
      <div className="max-w-5xl mx-auto">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-14"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E8E0D6]" />
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A89585] uppercase">
            The Creator
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E8E0D6]" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* ── Left: Image + stats ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-8 lg:items-start"
          >
            {/* Profile image */}
            <div className="relative">
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] opacity-20 blur-xl scale-110" />
              <div className="relative w-[140px] h-[140px] rounded-full overflow-hidden"
                style={{
                  border: '2px solid #C4A484',
                  boxShadow: '0 8px 32px rgba(196,164,132,0.30), 0 2px 8px rgba(196,164,132,0.20)',
                }}
              >
                <Image
                  src="/developer.jpg"
                  alt="Emmanuel ARIYO — CEO & Founder, EMEMZYVISUALS DIGITALS"
                  fill
                  sizes="140px"
                  className="object-cover object-top"
                  priority
                />
              </div>

              {/* Active badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-[#C4A484] flex items-center justify-center shadow-soft-md">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-[#1A1410]">{s.value}</p>
                  <p className="text-[11px] text-[#A89585] mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: Github,    href: 'https://github.com/Ememzyvisuals',           label: 'GitHub'    },
                { icon: Twitter,   href: 'https://x.com/Ememzyvisuals',                label: 'X/Twitter' },
                { icon: Facebook,  href: 'https://facebook.com/Ememzyvisuals',         label: 'Facebook'  },
                { icon: Instagram, href: 'https://instagram.com/Ememzyvisuals',        label: 'Instagram' },
                { icon: Music2,    href: 'https://tiktok.com/@Ememzyvisuals',          label: 'TikTok'    },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white border border-[#E8E0D6] flex items-center justify-center text-[#8B7B6B] hover:text-[#C4A484] hover:border-[#C4A484] hover:shadow-soft-md transition-all duration-200"
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Name + role */}
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#C4A484] uppercase mb-2">
                EMEMZYVISUALS DIGITALS
              </p>
              <h2 className="font-display text-4xl font-bold text-[#1A1410] mb-2 leading-tight">
                Emmanuel<br />
                <span className="gradient-text">ARIYO</span>
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm font-medium text-[#6B5D52] bg-[#F5F2EF] border border-[#E8E0D6] px-3 py-1 rounded-full">
                  CEO &amp; Founder
                </span>
                <span className="text-xs text-[#A89585]">· Emmanuel.A</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-[#6B5D52] text-base leading-relaxed">
              AI developer and systems builder focused on creating powerful tools for web
              applications, automation, and intelligent systems. Building the future of
              developer tooling — one AI-powered product at a time.
            </p>

            {/* Skills */}
            <div>
              <p className="text-xs font-semibold text-[#A89585] uppercase tracking-wider mb-3">
                Specialties
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span key={skill}
                    className="text-xs font-medium text-[#8B7B6B] bg-white border border-[#E8E0D6] px-3 py-1.5 rounded-full hover:border-[#C4A484] hover:text-[#C4A484] transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Quote */}
            <blockquote className="border-l-2 border-[#C4A484] pl-4 py-1">
              <p className="text-sm italic text-[#8B7B6B] leading-relaxed">
                "ClaudGPT is proof that frontier AI should be accessible to every developer,
                not locked behind expensive paywalls."
              </p>
              <footer className="text-xs text-[#A89585] mt-2 font-medium">
                — Emmanuel ARIYO
              </footer>
            </blockquote>

            {/* Built badge */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-[#1A1410] text-white px-4 py-2.5 rounded-2xl shadow-soft-md">
                <Zap className="w-3.5 h-3.5 text-[#C4A484]" />
                <span className="text-xs font-semibold">Builder of ClaudGPT</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F5F2EF] border border-[#E8E0D6] px-4 py-2.5 rounded-2xl">
                <Code2 className="w-3.5 h-3.5 text-[#C4A484]" />
                <span className="text-xs font-semibold text-[#6B5D52]">AI Systems Engineer</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
