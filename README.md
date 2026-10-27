# Agent Task Management Dashboard

A real-time frontend dashboard for managing agent tasks and streaming AI agent outputs built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase SSR**.

---

## Features

- **Supabase SSR Architecture**: Reusable browser client (`utils/supabase/client.ts`) with strict TypeScript environment validation.
- **Real-Time Postgres Changes**: Live subscription via `supabase.channel('tasks-realtime')` on the `tasks` table with instant insertion/update reflection and cleanup on unmount.
- **Task Dispatch Form (`components/TaskForm.tsx`)**:
  - Full client validation with optimistic loading states.
  - Inserts tasks directly with `pending` status.
  - Graceful error boundary and visual confirmations.
- **Task Feed & Card (`components/TaskCard.tsx`)**:
  - Color-coded status badges:
    - `pending`: Amber / Yellow
    - `in_progress`: Blue with pulse animation
    - `completed`: Emerald / Green
    - `failed`: Rose / Red
  - Preformatted expandable AI output viewer with one-click copy-to-clipboard.
- **Responsive Dashboard**:
  - Metric counters (Total, Pending, In Progress, Completed, Failed).
  - Status filter tabs and real-time live search.
  - Sticky sidebar form on desktop, clean stacked layout on mobile.

---

## Setup & Running

### 1. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Update with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### 2. Run Database Migration
Execute the SQL script in `supabase/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) to create the `tasks` table, enable RLS, and turn on Realtime replication.

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/tasks](http://localhost:3000/tasks).
