# Hydro Pump

AI agent monitoring dashboard. Pokémon evolves as tasks complete.

## Stack

- Next.js 14 (App Router) + Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Deploy: Vercel

## Setup (self-hosting)

### 1. Install

```bash
npm install
```

### 2. Supabase

Create a free project at https://supabase.com (Sign up → New Project).

After creating, go to **Settings → API** to find your URL and keys.

Then open **SQL Editor** (left sidebar) and run this:

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  progress int default 0,
  pokemon_id int,
  status text default 'active',
  due_date date,
  created_at timestamptz default now(),
  last_updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  agent_label text,
  title text not null,
  status text default 'waiting',
  created_at timestamptz default now()
);
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in these three values (Supabase Dashboard → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run

```bash
npm run dev
```

### 5. Deploy (optional)

```bash
npx vercel --prod
```

Set the same env vars in Vercel dashboard.

## Dev commands

```bash
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build
npm run start      # start production server
```

## API

### POST /api/tasks

Create or update a task. Same `project_id` + `agent_label` = update.

```json
{
  "project_id": "uuid",
  "agent_label": "my-agent",
  "title": "Task name",
  "status": "waiting | running | done | failed"
}
```

Progress auto-calculates: `done / total * 100`.

### POST /api/projects

Create a new project.

```json
{
  "name": "Project name",
  "pokemon_id": 25
}
```

`pokemon_id`: 1–649 (Gen 1–5). Random if omitted.

## Code structure

```
app/page.tsx              # Main dashboard
app/api/projects/         # Project CRUD
app/api/tasks/            # Task CRUD
components/ProjectCard.tsx # Card with expand/collapse
components/StatusPicker.tsx # Status dropdown
components/PokemonSprite.tsx # Sprite renderer
components/Blastoise.tsx  # Header mascot
lib/supabase.ts           # Supabase client
lib/theme.tsx             # Dark/light toggle
lib/pokemon.ts            # Evolution logic
```
