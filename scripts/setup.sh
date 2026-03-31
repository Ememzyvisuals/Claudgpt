#!/bin/bash
# ClaudGPT Setup Script — Emmanuel ARIYO — EMEMZYVISUALS DIGITALS
set -e
GREEN='\033[0;32m'; VIOLET='\033[0;35m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
echo -e "\n${VIOLET}╔══════════════════════════════════════════╗${NC}"
echo -e "${VIOLET}║        ClaudGPT Setup Script             ║${NC}"
echo -e "${VIOLET}║  EMEMZYVISUALS DIGITALS — Emmanuel ARIYO ║${NC}"
echo -e "${VIOLET}╚══════════════════════════════════════════╝${NC}\n"
if ! command -v node &> /dev/null; then echo -e "${RED}❌ Node.js not found${NC}"; exit 1; fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "\n${CYAN}Installing backend dependencies...${NC}"
cd backend && npm install && cd ..
echo -e "${GREEN}✅ Backend done${NC}"
echo -e "\n${CYAN}Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..
echo -e "${GREEN}✅ Frontend done${NC}"
if [ ! -f "backend/.env" ]; then cp .env.example backend/.env; echo -e "${YELLOW}⚠️  Created backend/.env — fill in your API keys${NC}"; fi
if [ ! -f "frontend/.env.local" ]; then
  cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ENVEOF
  echo -e "${YELLOW}⚠️  Created frontend/.env.local — fill in Supabase keys${NC}"
fi
echo -e "\n${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup Complete! 🚀               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}\n"
echo -e "  1. ${YELLOW}Edit${NC} backend/.env with your Groq + Supabase keys"
echo -e "  2. ${YELLOW}Edit${NC} frontend/.env.local with Supabase keys"
echo -e "  3. ${YELLOW}Run${NC} SQL migrations in Supabase dashboard"
echo -e "  4. ${CYAN}Start:${NC} cd backend && npm run dev"
echo -e "  5. ${CYAN}Start:${NC} cd frontend && npm run dev\n"
