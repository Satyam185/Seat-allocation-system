# AI Prompts Log

## Tool Used
Claude (Sonnet) — architecture planning, scaffolding, code generation

## Prompt Log

### 1. Architecture & Stack Decision
**Prompt:** "Review assessment brief and recommend Next.js monorepo (API
routes) vs. separate FastAPI backend, given 24-48hr time constraint."
**Output:** Recommended Next.js monorepo for velocity + type safety;
recommended keeping business logic in an isolated `lib/services/` layer
to preserve separability.
**Manual validation:** Accepted. Documented trade-off in DECISIONS.md.

### 2. Project File Tree
**Prompt:** "Propose folder structure for Next.js + Prisma + Zod +
services-layer architecture covering all functional requirements
(employee mgmt, project mapping, seat allocation, search, dashboard, AI NLQ)."
**Output:** Full directory tree (prisma/, lib/, app/api/, components/).
**Manual fix:** Added `projects` API route, `validations/` folder, and
`analytics.service.ts` after review — initial pass under-covered project
mapping and reporting concerns.
**Validation:** Manually cross-checked against all 8 named requirements
in the assessment brief.

### 3. Prisma Schema
**Prompt:** "Write complete Prisma schema for Supabase: Employee, Project,
Seat, AllocationHistory models with SeatStatus enum. Keep MVP-lean —
only fields required to track who sits where, what project they're on,
and allocation history for utilization reporting."
**Output:** Full schema.prisma with 1:1 Employee-Seat relation, optional
Project relation, append-only AllocationHistory table.
**Manual fix:** [fill in once your friend applies migration — note any
field changes made after real-world testing]
**Validation:** Pending — to be validated via `prisma migrate dev` once
DATABASE_URL is configured.

### 4. Zod Validation Schemas
**Prompt:** "Generate Zod schemas for createEmployee and assignSeat
matching the Prisma models."
**Output:** `createEmployeeSchema`, `assignSeatSchema` in
`lib/validations/`.
**Manual fix:** None at this stage.
**Validation:** Wired into API route handlers; to be tested with valid/
invalid payloads once DB is live.

### 5. Seed Script
**Prompt:** "Write a robust, deterministic faker-based seed script:
5,000 employees, 500 projects, 6,000 seats, with realistic ratios of
unseated/unassigned employees for edge-case testing."
**Output:** `prisma/seed.ts` — deterministic (faker.seed(42)), ~90% seat
assignment rate, ~85% project assignment rate, writes AllocationHistory
on seed.
**Manual fix:** [fill in once run against real DB]
**Validation:** Pending — to be run via `npx prisma db seed` once
DATABASE_URL is configured.

### 6. RBAC Scoping Decision
**Prompt:** "Given the brief mentions Employee/HR/Admin/Project personas
but provides no permission matrix, and time is constrained — should we
build real auth?"
**Output:** Recommended fake role-switcher (React Context, client-side
conditional rendering) instead of real authentication.
**Manual validation:** Accepted; documented as explicit scope decision
in DECISIONS.md.

### 7. API Route Scaffolding
**Prompt:** "Write thin, Zod-validated REST routes for employees and
seats (GET list with pagination, POST create/assign), no deep business
logic yet — that belongs in the services layer."
**Output:** `app/api/employees/route.ts`, `app/api/seats/route.ts`.
**Manual fix:** [fill in as business logic gets extracted into
seat.service.ts]
**Validation:** Pending — to be tested against live DB.

### 8. NLQ / AI Feature (to fill later)
**Prompt:** [prompt used to build ai.service.ts]
**Output:** [describe]
**Manual fix:** [describe]
**Validation:** [test queries + results]

---
*(Continue logging entries as work progresses — do not reconstruct at the end.)*