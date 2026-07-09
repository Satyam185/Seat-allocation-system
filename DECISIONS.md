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
- `Seat` model includes a `bay` field, `MAINTENANCE` in the `SeatStatus` enum, and enforces a composite unique constraint on `(floor, zone, seatNumber)`.
- `Project` model includes `managerName`, `description`, and `status`.
- `seat_allocations` is a separate append-only table specifically to support utilization metrics and historical reporting. It tracks `allocationStatus` ("ACTIVE" or "RELEASED") and `releasedDate`.
- Employees may exist without a seat (e.g., new joiners, remote) and without a project (bench/unassigned) — both fields are optional.

## Seed Data
- 5,000 employees, 10 named projects (Indigo, Indreed, Mydreed, Preed, Serfy, Oreed, bedegreed, Opreed, Serry, Kaary), and 6,000 seats distributed across 10 zones (A-J) generated via `@faker-js/faker` with a fixed seed (`faker.seed(42)`) for reproducibility.
- Seat Status breakdown: 4,500 OCCUPIED, 1,350 AVAILABLE, 100 RESERVED, 50 MAINTENANCE.
- Unseated employees: exactly 500 (intentionally left unseated to exercise new joiner flows and unassigned filters).

## Deployment
- Target: Vercel (frontend + API routes), Supabase (PostgreSQL).
- Live URL: https://seat-allocation-system-seven.vercel.app/

## Business Rules Implementation
- **Allocation Rules:** 1-employee-1-seat and 1-seat-1-employee are strictly enforced via the `SeatService` layer and database constraints.
- **Seat Status Lock:** Reserved or Maintenance seats cannot be allocated. They require an explicit status change before they become Available for allocation.
- **Seat Suggestions:** New joiner allocation logic utilizes proximity-based matching, prioritizing seats in the same zone as the employee's project, with fallback to any available seat.
- **Releases:** Releasing a seat returns it to `AVAILABLE` status. The corresponding `seat_allocations` record is updated with a `releasedDate` and `allocationStatus` = "RELEASED" rather than being deleted, preserving history.

## Known Deviations
- **Migrations vs. Push:** `npx prisma db push --force-reset` was used instead of `prisma migrate dev`. This was due to persistent Supabase connection pooler timeouts in a headless/non-interactive environment, which caused standard migrations to hang. The `prisma/migrations/` history is therefore sparse; `schema.prisma` is the authoritative source.
- **Seed Chunking:** The seed script uses a chunked insert approach (batches of 500 records) to avoid those same pooler timeout issues during bulk inserts.

## UI / UX
- **MVP Aesthetics:** The application uses a generic, functional UI (shadcn/ui defaults, minimal custom styling) to prioritize speed and functional completeness. A comprehensive navy + coral redesign was attempted but intentionally reverted to maintain simplicity and adhere to preferences.
- **Select Component Hydration Issue:** Encountered an issue where shadcn `SelectItem` displayed garbage values when passed an object or React node as `children` in certain Next.js setups; solved by explicitly passing a concatenated string (e.g. `` `${project.code} - ${project.name}` ``).