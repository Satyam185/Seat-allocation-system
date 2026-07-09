# Seat Allocation & Project Mapping System

MVP full-stack app for managing seat allocation and project mapping for ~5,000 employees. Built as a Next.js monorepo (frontend + API routes combined) instead of a separate FastAPI backend — see `DECISIONS.md` for why.

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Nova preset — Lucide icons + Geist font)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Validation:** Zod
- **AI:** Groq / Gemini (NLQ search feature)
- **Deployment:** Vercel

## Live Links
- **Frontend/Backend:** https://seat-allocation-system-seven.vercel.app/
- **GitHub:** https://github.com/Satyam185/Seat-allocation-system.git

## Setup Instructions
1. `npm install`
2. Copy `.env.example` → `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — from your Supabase project (Settings → Database)
   - `GROQ_API_KEY` or `GEMINI_API_KEY` — pick one
3. `npx prisma generate`
4. `npx prisma db push --force-reset` (Used instead of `prisma migrate dev` due to Supabase connection pooler timeouts in a non-interactive environment. Do not use `migrate dev` unless running a local DB.)
5. `npx prisma db seed` — populates employees, projects, and seats.
6. `npm run dev` → http://localhost:3000

## Authentication
Explicitly, **no real authentication is implemented**. A fake role-switcher (`RoleProvider`) is included in the UI for demonstration purposes only (to satisfy the requirement to enable different views for HR, Admin, Employees, etc.), but it has no backend enforcement. This was confirmed against the full assessment specification, as real authentication was never a listed requirement.

## Project Structure & Folder Purpose

### `prisma/`
- `schema.prisma` — Authoritative data model (Employee, Project, Seat, SeatAllocation + enums).
- `seed.ts` — Deterministic faker-based seed script (`faker.seed(42)`).

### `lib/`
- `db.ts` — Prisma client singleton. Always import `prisma` from here.
- `types.ts` — Shared TypeScript types/enums used across the app.
- `validations/` — Zod schemas (`employee.schema.ts`, `seat.schema.ts`, `project.schema.ts`, `ai.schema.ts`). These are the single source of truth for request payloads.
- `services/` — Business logic layer (Fully implemented):
  - `employee.service.ts` — Employee queries, filtering, creation, and updating.
  - `seat.service.ts` — Core logic: seat allocation, release, suggesting seats by proximity, and conflict handling.
  - `project.service.ts` — Project queries and assignment.
  - `dashboard.service.ts` — Real-time utilization aggregation queries.
  - `ai.service.ts` — NLP prompt routing, entity extraction via LLM, and query resolution.

### `app/api/`
REST endpoints (All implemented):
- `/api/dashboard/summary`
- `/api/dashboard/project-utilization`
- `/api/dashboard/floor-utilization`
- `/api/seats`
- `/api/seats/allocate`
- `/api/seats/release`
- `/api/seats/available`
- `/api/seats/suggest`
- `/api/seats/[id]/status`
- `/api/ai/query`
- `/api/employees`
- `/api/employees/[id]`
- `/api/projects`
- `/api/projects/[id]`
- `/api/projects/[id]/employees`

### `components/`
- `ui/` — shadcn/ui primitives.
- `role-provider.tsx` / `role-switcher.tsx` — Fake RBAC system.
- `search-filters.tsx`, `seat-table.tsx`, `utilization-chart.tsx`, `new-joiner-form.tsx` — Functional UI components.

## API Documentation

See `API.md` for a comprehensive list of every endpoint, method, request body shape, response shape, and error codes based on the live `route.ts` implementation.

## Seed Data Summary
- **Total Employees**: 5,000
- **Projects (10 Exact Names)**: Indigo, Indreed, Mydreed, Preed, Serfy, Oreed, bedegreed, Opreed, Serry, Kaary
- **Total Zones**: 10 (A through J)
- **Total Seats**: 6,000
- **Seat Status Breakdown**:
  - OCCUPIED: 4,500
  - AVAILABLE: 1,350
  - RESERVED: 100
  - MAINTENANCE: 50
- **Unseated Employees**: 500

## Debugging Notes
See `AI_PROMPTS.md` Section 8 for full detail regarding Supabase pooler timeouts, migration workarounds using `db push`, and seed chunking implementation to stabilize database transactions during bulk inserts.

## Deployment Notes
Deployed on **Vercel** at: https://seat-allocation-system-seven.vercel.app/
The database is hosted on **Supabase**.
Environment variables configured in Vercel:
- `DATABASE_URL` (Transaction connection pooler string)
- `DIRECT_URL` (Direct database connection string)
- `GROQ_API_KEY` (For the AI search functionality)

## Screenshots
*(Add screenshots of the live application below)*
- Dashboard Overview
- Employee & Seat Table
- AI Query Results
- New Joiner Form
