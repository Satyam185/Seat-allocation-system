# Design Decisions & Assumptions

## Stack
- **Next.js monorepo (App Router)** used instead of separate React + FastAPI
  backend, as originally suggested in the brief. Chosen for development
  velocity and end-to-end TypeScript type safety via Prisma.
  Trade-off: less clean frontend/backend separation; API routes are colocated
  with UI rather than an independently deployable service. Business logic is
  isolated in `lib/services/` to keep this swappable later if needed.

## Authentication & RBAC
- **No real authentication implemented.** Given the 24-48hr constraint, a
  full auth provider (NextAuth, session management, password handling) was
  out of scope relative to its cost.
- Instead, a **fake role switcher** (`RoleProvider` / `RoleSwitcher`) holds
  role state (ADMIN, HR, EMPLOYEE, PROJECT_LEAD) in React Context. UI
  elements conditionally render/hide based on `role`, satisfying the
  "enable employees, HR, Admin, and Project teams" requirement without
  building real access control.
- In production, this would be replaced with real session-based auth and
  server-side permission checks (not just client-side conditional rendering).

## Data Model
- **1 employee = 1 seat** (1:1 relation). No shared/hot-desking model.
- `AllocationHistory` is a separate append-only table (not just current state
  on `Seat`/`Employee`) specifically to support utilization metrics and
  historical reporting on the dashboard.
- Employees may exist without a seat (e.g., new joiners, remote) and without
  a project (bench/unassigned) — both fields are optional.

## Seed Data
- 5,000 employees, 500 projects, 6,000 seats generated via `@faker-js/faker`
  with a fixed seed (`faker.seed(42)`) for reproducibility.
- ~90% of employees are seeded with an active seat assignment; the remainder
  are intentionally left unseated to exercise empty/edge states (new joiner
  flow, unassigned filters).
- ~85% of employees are seeded with a project assignment; ~15% are bench/unassigned.

## Deployment
- Target: Vercel (frontend + API routes), Supabase (PostgreSQL).

## UI / UX
- **MVP Aesthetics:** The application uses a generic, functional UI (shadcn/ui defaults, minimal custom styling) to prioritize speed and functional completeness. A comprehensive navy + coral redesign was attempted but intentionally reverted to maintain simplicity and adhere to preferences.
- **Select Component Hydration Issue:** Encountered an issue where shadcn `SelectItem` displayed garbage values when passed an object or React node as `children` in certain Next.js setups; solved by explicitly passing a concatenated string (e.g. `` `${project.code} - ${project.name}` ``).