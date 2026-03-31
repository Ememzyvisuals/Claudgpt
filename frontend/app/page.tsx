'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2, Bot, Zap, Shield, ArrowRight,
  CheckCircle2, Eye, MessageSquare, Layers
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { AboutDeveloper } from '@/components/shared/AboutDeveloper';

// ── Why ClaudGPT vs raw Groq / Claude Code / Codex ──────────────
const VS_GROQ = [
  {
    them: 'Groq Playground',
    gap: 'Just a chat window. You still write every file yourself.',
    us: 'ClaudGPT writes, structures, and exports your entire project.',
  },
  {
    them: 'Claude Code / Codex',
    gap: 'Terminal-only. Requires local setup, Git, Node, all dependencies.',
    us: 'Runs in your browser. Zero setup. Instant live preview.',
  },
  {
    them: 'ChatGPT / Gemini',
    gap: 'One model, one message. No pipeline, no review, no debugging agent.',
    us: '9 specialised agents working in sequence — plan, architect, code, debug, review.',
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: '9-Agent Pipeline',
    desc: 'Not a single model — a team. Planner, Architect, Coder, Debugger, and Reviewer agents work in sequence so every project is planned before it\'s coded and reviewed before it\'s exported.',
    tag: 'Core',
  },
  {
    icon: Code2,
    title: 'Full Project Export',
    desc: 'Every file, every config, every dependency. Download as a ZIP and run it instantly — not just snippets you have to stitch together yourself.',
    tag: 'Core',
  },
  {
    icon: Eye,
    title: 'Live App Preview',
    desc: 'See your generated web app running in the browser before you download. Desktop, tablet, and mobile viewports — no local setup needed.',
    tag: 'Unique',
  },
  {
    icon: Bot,
    title: 'WhatsApp Bot Builder',
    desc: 'Production-ready WhatsApp bots using Baileys — commands, auto-replies, group management, and media support. One prompt, full source code.',
    tag: 'Popular',
  },
  {
    icon: Shield,
    title: 'Built-in Code Review',
    desc: 'Every project gets OWASP security scanning, performance analysis, and automated bug detection — before you ever see the output.',
    tag: 'Smart',
  },
  {
    icon: MessageSquare,
    title: 'Voice + Vision',
    desc: 'Talk to ClaudGPT with your microphone. Upload screenshots, diagrams, or error messages and let vision AI understand them. 12 human-quality TTS voices read responses aloud.',
    tag: 'New',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Describe what you want to build',
    desc: 'In plain English. "Build me a WhatsApp bot that responds to commands" is a complete prompt.',
  },
  {
    step: '02',
    title: 'Nine agents get to work',
    desc: 'Planner designs the architecture. Architect structures the files. Coder writes every line. Debugger fixes errors. Reviewer audits security.',
  },
  {
    step: '03',
    title: 'Preview, export, and ship',
    desc: 'See your app running live in the browser. Download the full project as a ZIP. Open it in VS Code and it just works.',
  },
];

const MODELS = [
  { name: 'Kimi K2',        role: 'Coder & Debugger',  speed: '500 tok/s',  type: 'preview'    },
  { name: 'GPT-OSS 120B',   role: 'Planner & Reviewer',speed: '500 tok/s',  type: 'production' },
  { name: 'Llama 4 Scout',  role: 'Vision',             speed: '460 tok/s',  type: 'preview'    },
  { name: 'Llama 3.3 70B',  role: 'Chat Streaming',     speed: '280 tok/s',  type: 'production' },
  { name: 'Orpheus V1',     role: 'Voice Output',       speed: '12 voices',  type: 'preview'    },
  { name: 'Whisper V3',     role: 'Voice Input',        speed: '216× RT',    type: 'production' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1A1410]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E0D6]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Why ClaudGPT', href: '#why' },
              { label: 'Features',     href: '#features' },
              { label: 'How it Works', href: '#how-it-works' },
              { label: 'About',        href: '#about' },
            ].map((item) => (
              <a key={item.label} href={item.href}
                className="text-sm text-[#6B5D52] hover:text-[#1A1410] transition-colors font-medium">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"  className="btn-ghost text-sm px-3 md:px-5 py-2">Sign in</Link>
            <Link href="/signup" className="btn-primary text-sm px-3 md:px-5 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F2] to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-[#C4A484]/8 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Badge — explains the WHY upfront */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#E8E0D6] rounded-full px-5 py-2 text-sm text-[#8B7B6B] font-medium mb-8 shadow-soft-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Not a chatbot — a complete AI dev team
            </div>

            {/* Headline — clear value prop */}
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6 tracking-tight">
              Build full apps,<br />
              <span className="gradient-text">not just prompts</span>
            </h1>

            {/* Subheadline — directly answers Thomas's question */}
            <p className="text-xl text-[#6B5D52] max-w-2xl mx-auto mb-4 leading-relaxed">
              ClaudGPT is what you get when 9 specialised AI agents — each running frontier models —
              collaborate to plan, write, debug, and review your entire project.
              Not a chat window. A <strong>complete development pipeline.</strong>
            </p>

            {/* Direct differentiation — answers "why not use Groq/Claude Code directly?" */}
            <p className="text-sm text-[#A89585] max-w-xl mx-auto mb-10">
              Groq gives you raw speed. Claude Code needs a terminal. Codex needs VS Code.
              ClaudGPT gives you a finished, exportable project — in your browser — for free.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/signup" className="btn-primary flex items-center gap-2.5 text-base px-8 py-3.5">
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-ghost flex items-center gap-2.5 text-base px-8 py-3.5">
                Sign In
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#A89585]">
              {[
                'No credit card',
                'No local setup',
                '9 AI agents',
                'Full project export',
                'Live preview',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A484]" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Why ClaudGPT — direct comparison ──────────────── */}
      <section id="why" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-[#C4A484] uppercase mb-3">
              The Honest Comparison
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#1A1410] mb-4">
              Why not just use<br />
              <span className="gradient-text">Groq, Claude Code, or Codex?</span>
            </h2>
            <p className="text-[#6B5D52] max-w-xl mx-auto text-lg">
              Great tools — but they all require you to do the hard parts yourself.
            </p>
          </motion.div>

          <div className="space-y-4">
            {VS_GROQ.map((item, i) => (
              <motion.div
                key={item.them}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start bg-[#FAFAF8] border border-[#E8E0D6] rounded-3xl p-6"
              >
                {/* Them */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#A89585] uppercase mb-1">{item.them}</p>
                  <p className="text-sm text-[#6B5D52] leading-relaxed">{item.gap}</p>
                </div>

                {/* vs */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#1A1410] flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* ClaudGPT */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#C4A484] uppercase mb-1">ClaudGPT</p>
                  <p className="text-sm text-[#1A1410] font-medium leading-relaxed">{item.us}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Models ────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#1A1410]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#C4A484] uppercase mb-3">Under the Hood</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
              Frontier models. Routed intelligently.
            </h2>
            <p className="text-[#6B5D52] text-base max-w-xl mx-auto">
              Each agent uses the best model for its task — running on Groq's infrastructure
              at speeds up to 1000 tokens per second.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MODELS.map((m) => (
              <div key={m.name}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 hover:bg-white/8 transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{m.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.type === 'production'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {m.type === 'production' ? 'Stable' : 'Preview'}
                  </span>
                </div>
                <p className="text-xs text-[#8B7B6B]">{m.role}</p>
                <p className="text-xs text-[#C4A484] font-mono mt-1">{m.speed}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-[#C4A484] uppercase mb-3">What You Get</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#1A1410] mb-4">
              Everything from prompt<br />
              <span className="gradient-text">to production-ready project</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                viewport={{ once: true }}
                className="group bg-white border border-[#E8E0D6] rounded-3xl p-6 hover:border-[#C4A484] hover:shadow-soft-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] flex items-center justify-center shadow-primary">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-[#C4A484] uppercase bg-[#F5F2EF] border border-[#E8E0D6] px-2 py-0.5 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#1A1410] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B5D52] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-[#C4A484] uppercase mb-3">The Process</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#1A1410]">
              From idea to <span className="gradient-text">running app</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-display text-6xl font-bold text-[#E8E0D6] mb-4 leading-none">{step.step}</div>
                <h3 className="font-display text-lg font-semibold text-[#1A1410] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B5D52] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Developer ───────────────────────────────── */}
      <div id="about">
        <AboutDeveloper />
      </div>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#1A1410] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4A484]/10 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative"
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-[#C4A484] uppercase mb-4">Ready to Build?</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Stop prompting.<br />Start shipping.
          </h2>
          <p className="text-[#8B7B6B] mb-8 text-lg">
            No credit card. No terminal. No local setup. Just describe what you want to build.
          </p>
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2.5 text-base px-10 py-4">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[#4d4030] text-xs mt-4">
            Free forever · No credit card · Full project export
          </p>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-[#1A1410] border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" inverted />
          <p className="text-sm text-[#6B5D52] text-center">
            © {new Date().getFullYear()} EMEMZYVISUALS DIGITALS · Built by{' '}
            <span className="text-[#C4A484] font-medium">Emmanuel ARIYO</span>
          </p>
          <div className="flex items-center gap-4 text-sm text-[#6B5D52]">
            <Link href="/login"  className="hover:text-[#C4A484] transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-[#C4A484] transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
