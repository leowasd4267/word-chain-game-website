# Word Chain Game Website

This repository contains a React + Node.js (TypeScript) implementation of a classroom word-chain game (끝말잇기) with real-time multiplayer using Socket.IO, PostgreSQL storage (Prisma), and Render deployment configuration.

Quick overview:
- Backend: Node.js + Express + TypeScript, Socket.IO, Prisma
- Frontend: React + Vite + TypeScript, socket.io-client
- DB: PostgreSQL (Prisma schema provided)
- 한글 단어 검사: external API (env) with local fallback file words/kor_words_sample.txt
- Admin: initial admin seed user (use credentials below or override via env)

Admin seed credentials (development — defaults)
- username: leowasd4267 (override with ADMIN_USERNAME env)
- number: 0000 (override with ADMIN_NUMBER env)

See README for setup and Render deployment instructions.
