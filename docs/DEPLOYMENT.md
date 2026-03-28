# ClaudGPT — Deployment Guide

## Overview
- Frontend → Vercel (free)
- Backend → Render (free)
- Database → Supabase (cloud, already hosted)

## Deploy Backend to Render
1. render.com → New Web Service → connect GitHub repo
2. Root Directory: backend, Build: `npm install && npm run build`, Start: `npm start`
3. Add all environment variables from backend/.env
4. Set ALLOWED_ORIGINS to your Vercel URL

## Deploy Frontend to Vercel
1. vercel.com → New Project → import GitHub repo
2. Framework: Next.js, Root: frontend
3. Add environment variables:
   - NEXT_PUBLIC_API_URL = https://your-app.onrender.com
   - NEXT_PUBLIC_SUPABASE_URL = ...
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = ...

## Post-Deploy
1. Update Supabase Auth → URL Configuration → Site URL to Vercel URL
2. Update ALLOWED_ORIGINS on Render to Vercel URL

## Verify
```bash
curl https://your-app.onrender.com/health
# Should return: {"status":"ok","app":"ClaudGPT","creator":"Emmanuel ARIYO",...}
```

## Notes
- Free Render instances sleep after 15min inactivity (30-60s cold start)
- Use UptimeRobot to ping /health every 14min to keep warm

---
*Emmanuel ARIYO — EMEMZYVISUALS DIGITALS*
