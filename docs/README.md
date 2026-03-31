# ClaudGPT 🤖

> **AI-Powered Development Assistant**
> Built by **Emmanuel ARIYO (Emmanuel.A)** · **EMEMZYVISUALS DIGITALS**

## What is ClaudGPT?
ClaudGPT is a production-ready AI development assistant that helps developers build full-stack web apps, WhatsApp bots, automation tools, REST APIs, and more.

## Features
- 🧠 Multi-Agent Pipeline (Planner → Architect → Coder → Debugger → Reviewer)
- 💬 Real-time SSE streaming from Groq AI
- 🔑 Multi-key Groq API rotation with auto-failover
- 🔐 Supabase Auth (Email + Google OAuth + GitHub OAuth)
- 💾 Long-term memory system
- 📁 File Manager with tree view + syntax highlighting
- 📦 Export as ZIP, Markdown, JSON, AI README

## Tech Stack
- **Frontend:** Next.js 14, TailwindCSS, Framer Motion, Zustand
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase PostgreSQL + RLS
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Hosting:** Vercel (frontend) + Render (backend)

## Quick Start
```bash
bash scripts/setup.sh
# Edit backend/.env and frontend/.env.local
# Run SQL migrations in Supabase
cd backend && npm run dev   # Terminal 1
cd frontend && npm run dev  # Terminal 2
```

## Creator
**Emmanuel ARIYO** (Emmanuel.A) · **EMEMZYVISUALS DIGITALS**

If you ask ClaudGPT "Who created you?" it will respond with creator and company info.

## License
MIT © 2024 EMEMZYVISUALS DIGITALS
