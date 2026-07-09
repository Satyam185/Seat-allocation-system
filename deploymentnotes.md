# Deployment Notes & Guide

This document outlines how the Seat Allocation & Project Mapping System is deployed to production using **Vercel** (for the Next.js application) and **Supabase** (for the PostgreSQL database).

## 1. Architecture Overview
- **Frontend & API**: Hosted on Vercel as a single Next.js monorepo. Vercel handles the Next.js App Router, SSR, and API route execution via serverless functions.
- **Database**: Hosted on Supabase (PostgreSQL). Supabase provides two connection URLs: one for transaction pooling (PgBouncer) which is required for serverless environments like Vercel, and a direct connection for migrations.

## 2. Database Setup (Supabase)
1. Create a new project in your Supabase dashboard.
2. Navigate to **Project Settings -> Database**.
3. Under the **Connection string** section, make sure **Use connection pooling** is checked (Mode: Transaction).
4. Copy the two connection strings provided:
   - **Pooler Connection (IPv4/Transaction)**: This will be your `DATABASE_URL`. It usually has `?pgbouncer=true&connection_limit=1` at the end for Prisma compatibility.
   - **Direct Connection (IPv4/Session)**: This will be your `DIRECT_URL`. It connects directly to the DB without the pooler, which Prisma requires for running schema migrations.

## 3. Environment Variables
You need to configure the following environment variables in your deployment environment (e.g., Vercel Dashboard):

| Variable Name | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | The transaction-pooled connection string | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | The direct database connection string | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `GROQ_API_KEY` | API Key for the AI assistant | (Optional if using Gemini instead) |
| `GEMINI_API_KEY` | API Key for the AI assistant | (Optional if using Groq instead) |

## 4. Application Deployment (Vercel)
1. Push your code to a public or private GitHub repository.
2. Log into Vercel and click **Add New -> Project**.
3. Import your GitHub repository.
4. Leave the Framework Preset as **Next.js**.
5. **Build Command**: Vercel should automatically detect this, but ensure it is `npm run build` (which maps to `prisma generate && next build` in `package.json`).
6. **Environment Variables**: Add all the variables listed in Section 3 to the Vercel dashboard.
7. Click **Deploy**.

## 5. Database Schema & Seeding in Production
Because Vercel serverless environments are completely headless and non-interactive, standard Prisma migrations (`prisma migrate dev`) will often fail or hang when prompt confirmations are required. 

Additionally, the Supabase free-tier connection pooler occasionally drops connections during heavy bulk inserts. To handle this:

1. **Deploy the Schema**:
   Instead of running standard migrations, we used `db push` to force synchronize the schema. If you need to deploy the schema manually from your local machine to the production DB:
   ```bash
   npx prisma db push --force-reset
   ```
   *(Note: This drops all data and forcefully applies the schema. Use cautiously.)*

2. **Seed the Database**:
   The `seed.ts` script has been specifically optimized to handle Supabase connection drops by chunking database inserts into batches of 500 records.
   To seed the production database from your local machine (ensure your local `.env` has the production Supabase URLs):
   ```bash
   npx prisma db seed
   ```

## 6. Live Application
Once the build completes and the database is seeded, the application will be live. 
- **Current Live URL**: https://seat-allocation-system-seven.vercel.app/
