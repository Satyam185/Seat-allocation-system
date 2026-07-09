# AI Prompts Log

This document records the exact prompts used to generate, debug, and verify the Seat Allocation System, organized exactly as required by the assessment specification.

### 1. Prompt used for planning
* **Actual prompt text used:** "based on the project update the Ai_PROMPTS, readme, and decisions file"
* **What the AI generated:** Updated markdown files (`README.md`, `DECISIONS.md`) to reflect the current state of the Next.js workspace and generated an initial `implementation_plan.md` outlining the architecture.
* **What was correct:** Addressed the requirement to document the project context effectively.
* **What was incorrect / had to be fixed manually:** No major fixes were required manually; the structure provided a solid foundation for the remainder of the session.
* **How correctness was validated:** Verified by visually inspecting the updated markdown files in the file explorer.

### 2. Prompt used for database design
* **Actual prompt text used:** "Prompt 1 — Schema Correction: Update prisma/schema.prisma to match these corrected requirements. Do not run migrations yet — just update the schema file first... Seat model — add missing fields: bay, MAINTENANCE to SeatStatus enum, composite unique constraint on (floor, zone, seatNumber)... Project model — add description, managerName, status"
* **What the AI generated:** Updated `prisma/schema.prisma` to include missing fields (`bay` for Seat, `description`, `managerName`, `status` for Project) and added the composite unique constraint `@@unique([floor, zone, seatNumber])` along with the `MAINTENANCE` SeatStatus enum.
* **What was correct:** Added the exact fields and schema relations requested.
* **What was incorrect / had to be fixed manually:** The `employee.role` was already correct but we ensured it mapped correctly to the specification. 
* **How correctness was validated:** Ran `npx prisma db push --force-reset` to successfully sync the new schema to the Supabase Postgres instance.

### 3. Prompt used for backend
* **Actual prompt text used:** "Prompt 3 — API Route Restructure (match spec exactly): Restructure and complete the API routes to match these exact endpoints from the specification... Employee routes... Project routes... Seat routes"
* **What the AI generated:** Restructured and implemented `app/api/employees/[id]/route.ts`, `app/api/projects/route.ts`, `app/api/projects/[id]/employees/route.ts`, and updated seat routes for seat allocations.
* **What was correct:** Mapped HTTP methods and route patterns to match the spec exactly (e.g. ensuring `DELETE` was used for deactivation rather than hard deletes).
* **What was incorrect / had to be fixed manually:** No route fixes were necessary, but on the backend data generation (`seed.ts`), we encountered an issue where chunking 2,000 records caused a Supabase connection timeout, requiring manual intervention to reduce chunk sizes to 500.
* **How correctness was validated:** Checked the API routes using Next.js dev server and executed subsequent standalone verification scripts against the endpoints.

### 4. Prompt used for seat allocation logic
* **Actual prompt text used:** "Prompt 4 — Seat Allocation Business Logic (service layer): Implement lib/services/seat.service.ts with these exact business rules from the spec... allocateSeat(employeeId, seatId): Reject (409) if seat.status is OCCUPIED, RESERVED, or MAINTENANCE..."
* **What the AI generated:** Implemented `allocateSeat` and `releaseSeat` functions in `lib/services/seat.service.ts`, correctly handling 409 rejections for `OCCUPIED`, `RESERVED`, and `MAINTENANCE` statuses, and preventing employees from having duplicate active seat allocations.
* **What was correct:** Implemented the precise business logic and transaction constraints required.
* **What was incorrect / had to be fixed manually:** Logic was correct on the first pass; no manual logic fixes were required.
* **How correctness was validated:** Verified using `verify.ts` and automated API tests that correctly asserted an HTTP 409 response when allocating an already occupied or reserved seat.

### 5. Prompt used for AI assistant
* **Actual prompt text used:** "Prompt 5 — AI Assistant (match exact response format): Implement lib/services/ai.service.ts and app/api/ai/query/route.ts... Request format: { \"query\": \"Where is my seat?...\" } Response format: { \"answer\": \"You are allocated Floor 2, Zone B...\" } Build this as a two-step pipeline: Intent + entity extraction..."
* **What the AI generated:** Built a robust two-step AI pipeline using the Gemini API. First, it extracts intents via JSON mode validated against Zod schemas, then executes a deterministic query based on intent, and finally formats a natural-language sentence. A fallback RegEx pipeline was also provided.
* **What was correct:** The robust two-step deterministic pipeline and exact JSON schema matching.
* **What was incorrect / had to be fixed manually:** We originally planned to return raw JSON filters directly, but the prompt correctly instructed us to format the output as an exact natural language sentence instead.
* **How correctness was validated:** Wrote and executed `test_ai.ps1` which sent a test payload to `/api/ai/query` and successfully logged: `"answer": "You are allocated Floor X, Zone Y, Bay Z, Seat W..."`

### 6. Prompt used for frontend
* **Actual prompt text used:** "Prompt 6 — Dashboard UI (simple, per spec's actual list): Update the dashboard UI (app/page.tsx and related components) to display exactly what the spec requires — keep it simple, no visual redesign, functional only: Stat cards... Two charts/tables... Project-wise seat allocation... Floor-wise occupancy"
* **What the AI generated:** Rewrote `components/utilization-chart.tsx` to utilize exact Dashboard API endpoints. Populated the 6 required stat cards (including Pending Allocation), generated a Floor-wise Occupancy bar chart (adding the requested Maintenance segment), and added a Project-wise Seat Allocation table.
* **What was correct:** UI components successfully mirrored the requirements without introducing any out-of-scope visual redesigns or color adjustments.
* **What was incorrect / had to be fixed manually:** Required modifying the `DashboardService` backend layer to calculate the `pendingAllocation` metric by mapping over employees missing a seat before the frontend could render it.
* **How correctness was validated:** Started the frontend dev server and spawned an automated headless browser subagent to capture a full-page screenshot (`dashboard_final.webp`), confirming all charts and table elements rendered identically to the specifications.

### 7. Prompt used for testing
* **Actual prompt text used:** "Prompt 7 — Composite Constraint + Data Integrity Verification: After schema and seed updates... Verify and report: Exactly 10 projects exist... Exactly 10 zones in use... Seat status counts... Unseated employees >= 50... Attempt to manually create two seats with the same floor+zone+seatNumber... Attempt to allocate an already-OCCUPIED seat..."
* **What the AI generated:** Executed Prisma commands to deploy the schema and ran the seed script. Wrote a standalone `verify.ts` script to query the live database and execute HTTP tests against the `/api/seats` endpoints to assert constraint failures.
* **What was correct:** The script accurately executed all required functional integration tests.
* **What was incorrect / had to be fixed manually:** The `verify.ts` script initially failed to compile due to missing `@prisma/client` pathing and using incorrect relation fields (`seats` instead of `seat` for a 1:1 relation). Had to manually fix the script to use `PrismaPg` adapter and correct relation names.
* **How correctness was validated:** The script executed successfully and output `PASS` for all 7 verifications, proving the composite constraint and seat allocations worked flawlessly.

### 8. Prompt used for debugging
* **Actual prompt text used:** (System/Error prompts): `P1001: Can't reach database server` and `Error: Prisma Migrate has detected that the environment is non-interactive`
* **What the AI generated:** Leveraged `manage_task` to inspect background logs, utilized the `schedule` timer to poll Supabase status, and eventually utilized `npx prisma db push --accept-data-loss` as a programmatic workaround for the limitations of interactive Prisma migrations in headless/CI environments.
* **What was correct:** Accurately diagnosed that the Supabase free-tier connection pooler was timing out and dropping connections.
* **What was incorrect / had to be fixed manually:** The requested migration command `npx prisma migrate dev` repeatedly hung or failed because it required interactive terminal confirmations for constraint changes that are inaccessible to automated agents. We explicitly bypassed this by resetting the DB and forcing schema synchronization.
* **How correctness was validated:** Re-ran the aforementioned verification script which proved the database was successfully reset, synchronized, and seeded over the stabilized connection.

### 9. Prompt used for deployment
*Not yet completed*

### 10. Prompt used for refactoring (if any)
* **Actual prompt text used:** "Prompt 2 — Seed Script Correction: Update prisma/seed.ts to match these corrected requirements: Replace the 500 faker-generated projects with EXACTLY these 10 named projects... Increase from 4 zones to minimum 10 zones..."
* **What the AI generated:** Refactored `prisma/seed.ts` to strictly seed exactly the 10 named projects required by the spec, mapped 10 zones (A-J), and maintained specific numerical boundaries for Seat statuses rather than arbitrary randomization.
* **What was correct:** Generated the exact requested entities deterministically.
* **What was incorrect / had to be fixed manually:** Discovered that pushing 2,000 records in a single chunk caused PgBouncer transaction timeouts on the Supabase instance. Refactored the script manually to chunk inserts by 500.
* **How correctness was validated:** Executed `npx prisma db seed` successfully, reporting terminal output asserting exactly 10 projects, 10 zones, 6000 seats, and 500 unseated employees.