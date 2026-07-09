# Debugging Notes

This document acts as a repository of the primary issues encountered during the development of the Seat Allocation System, along with the precise fixes implemented to solve them. This serves as a reference for future maintainers.

## 1. Supabase Connection Pooler Timeouts (`P1001` / Non-Interactive Migration Hangs)
**The Problem:**
When attempting to run `npx prisma migrate dev` in a non-interactive automated environment (or via CI/CD), the terminal would hang indefinitely. This was compounded by Supabase's free-tier PgBouncer connection pooler dropping connections, throwing `P1001: Can't reach database server`. The migration process required terminal confirmation for data-loss warnings, but since it was headless, it hung until the database connection closed.

**The Fix:**
We bypassed `prisma migrate dev` entirely in automated/headless setups. Instead, we used:
```bash
npx prisma db push --force-reset
```
This forces the schema to synchronize without requiring interactive terminal prompts, bypassing the hang.

## 2. Seed Script Bulk Insert Transaction Timeouts
**The Problem:**
During the seeding process, inserting 6,000 Seats or 5,000 Employees in a single `createMany` transaction caused the Supabase connection to abruptly close. PgBouncer limits transaction sizes and durations, which were being exceeded by the massive bulk inserts.

**The Fix:**
We manually refactored `prisma/seed.ts` to chunk all inserts into batches of 500 records.
```typescript
// Insert in chunks to avoid Prisma/PgBouncer limits
for (let i = 0; i < seatData.length; i += 500) {
  await prisma.seat.createMany({ data: seatData.slice(i, i + 500) });
}
```
This successfully resolved the connection drops.

## 3. React Infinite Loop: "Maximum update depth exceeded"
**The Problem:**
The global search/filter bar began throwing a "Maximum update depth exceeded" infinite loop crash:
`Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.`
This was traced to `components/search-filters.tsx`. The search input was using a complex Primitive from `@base-ui/react/input`. In certain versions, this primitive fires its internal `onChange` handler synchronously whenever its `value` prop is updated from the outside, which in turn updated the React state, which updated the `value` prop, creating an inescapable infinite loop.

**The Fix:**
We stripped out the `@base-ui/react/input` dependency entirely in `components/ui/input.tsx` and replaced it with a standard, native HTML `<input>` element. Since the styling was already being applied directly via Tailwind CSS, there was zero visual difference, but the native `<input>` behaves predictably and solved the loop immediately.

## 4. Disappearing Employees on Update (The `findFirst` PostgreSQL Quirk)
**The Problem:**
When using the AI/Search functionality to search for an employee by name (e.g., "Keara"), changing their assigned project would suddenly cause them to "disappear" from subsequent search results, and a *different* employee starting with "K" would take their place.

**The Cause:**
PostgreSQL handles row updates under the hood by physically moving the updated row to the end of the data file. The backend search function in `AiService` was utilizing Prisma's `.findFirst()` without an explicit `orderBy`. Because the updated employee was moved to the end of the disk, `.findFirst()` suddenly grabbed the *next* employee that matched the search criteria, making it appear as though the original employee was deleted.

**The Fix:**
We updated the AI and Employee search services to use `.findMany()` and appropriately handle arrays of results, combined with strictly sorting lists by `createdAt` to ensure stable, deterministic ordering regardless of when a row was last updated.

## 5. Select Component Garbage Hydration
**The Problem:**
The shadcn/ui `<Select>` component occasionally rendered garbage text/object [Object object] strings when attempting to pass complex nodes as children to the `SelectItem`.

**The Fix:**
We ensured that all `SelectItem` children only ever receive explicitly concatenated primitives.
```tsx
// Incorrect:
<SelectItem value={project.id}>{project}</SelectItem>

// Correct:
<SelectItem value={project.id}>{`${project.code} - ${project.name}`}</SelectItem>
```
