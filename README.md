# Bariton Music Academy - Web Frontend (`bariton-web`)

Single-Page Application (SPA) frontend for the Bariton Music Academy online learning platform, built with Vue 3, Vite, Tailwind CSS v4, and Pinia.

---

## Requirements
- Node.js 18+ (tested with Node 20+)
- npm 9+

---

## Quickstart Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Start development server
npm run dev
```

App will run at `http://localhost:5173`. Make sure `bariton-api` is running simultaneously at `http://localhost:8000`.

---

## Available Scripts
- `npm run dev`: Launch local Vite dev server.
- `npm run build`: Production build into `dist/`.
- `npm test`: Run unit and store tests with Vitest.

---

## Roles & Demo Accounts
Log in with password `Secret123!`:
- **Super Admin**: `admin@bmas.com` -> `/admin/dashboard`
- **Coordinator**: `coordinator@bmas.com` -> `/coordinator/dashboard`
- **Instructor**: `instructor@bmas.com` -> `/instructor/dashboard`
- **Finance Staff**: `finance@bmas.com` -> `/finance/dashboard` (prompts 2FA setup on login)
- **Student**: `student.adult@bmas.com` -> `/student/dashboard`
