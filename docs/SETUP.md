# ClaudGPT — Setup Guide

## Prerequisites
- Node.js 20+, npm 9+, Git
- Free accounts: Supabase, Groq, (optional) Google Cloud, GitHub OAuth

## Step 1 — Clone & Install
```bash
git clone https://github.com/your-username/claudgpt.git
cd claudgpt
bash scripts/setup.sh
```

## Step 2 — Get Groq API Keys
1. Go to console.groq.com
2. Create 2-3 API keys for rotation
3. Add to backend/.env as GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3

## Step 3 — Set Up Supabase
1. Create project at supabase.com
2. Go to Settings → API, copy URL + keys
3. Run migrations in SQL Editor (001, 002, 003 in order)
4. Enable Google/GitHub OAuth in Authentication → Providers

## Step 4 — Environment Variables

**backend/.env:**
```env
GROQ_API_KEY_1=gsk_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-min-32-chars
ALLOWED_ORIGINS=http://localhost:3000
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 5 — Run
```bash
cd backend && npm run dev  # :4000
cd frontend && npm run dev # :3000
```

Test: curl http://localhost:4000/health

## Common Issues
- No Groq keys → set GROQ_API_KEY_1 in backend/.env
- CORS error → add localhost:3000 to ALLOWED_ORIGINS
- Auth redirect → set Site URL to http://localhost:3000 in Supabase
