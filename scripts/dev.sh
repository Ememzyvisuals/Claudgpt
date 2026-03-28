#!/bin/bash
# ClaudGPT Dev Start Script
echo "Starting ClaudGPT Development Servers..."
(cd backend && npm run dev) & BACKEND_PID=$!
(cd frontend && npm run dev) & FRONTEND_PID=$!
echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
