# Aqua Jet

> AI agent monitoring dashboard with Pokémon evolution — built for [OpenClaw](https://openclaw.ai)

![Aqua Jet Dashboard](https://aqua-jet.vercel.app/og.png)

**Live demo:** [aqua-jet.vercel.app](https://aqua-jet.vercel.app)

---

## What is this?

Aqua Jet turns your AI agent runs into a Pokémon adventure.

Each project gets a Pokémon. As your agents complete tasks, the Pokémon evolves. Projects that stall stay stuck as eggs.

Built on top of OpenClaw's subagent system. One HTTP POST from your agent = dashboard updates in real time.

---

## Features

- Pokémon sprites evolve based on project progress (Gen 1–5 BW sprites, 291 base forms)
- Task list with `waiting / active / issue / done` status
- Done tasks sink to the bottom automatically (iOS Notes style)
- D-day countdown on due dates
- Blastoise as the mascot (naturally)
- No polling — agents push updates via HTTP

---

## Stack

- **Frontend:** Next.js 14 + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel
- **Sprites:** [PokeAPI](https://github.com/PokeAPI/sprites) (BW generation, free)

---

## Agent Integration

Your agent sends one HTTP POST when it starts and one when it finishes. No SDK, no extra dependencies.

```python
import httpx

PROJECT_ID = "your-project-uuid"  # from Supabase

# Task started
httpx.post("https://aqua-jet.vercel.app/api/tasks", json={
    "project_id": PROJECT_ID,
    "agent_label": "unique-agent-label",
    "title": "번역 작업 (claude-code-guide)",
    "status": "running"
})

# Task done
httpx.post("https://aqua-jet.vercel.app/api/tasks", json={
    "project_id": PROJECT_ID,
    "agent_label": "unique-agent-label",
    "title": "번역 작업 (claude-code-guide)",
    "status": "done"
})
```

Progress is calculated automatically: `done tasks / total tasks * 100`

When progress hits 100%, the project status flips to `done` and the Pokémon reaches its final evolution.

---

## Self-hosting

### 1. Clone

```bash
git clone https://github.com/dalbee-ship-it/aqua-jet
cd aqua-jet
npm install
```

### 2. Supabase setup

Create a new Supabase project. Run this SQL:

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

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Add the same env vars in Vercel dashboard.

---

## API Reference

### POST /api/tasks

Create or update a task. If a task with the same `project_id` + `agent_label` already exists, it updates the status.

**Request body:**

```json
{
  "project_id": "uuid",
  "agent_label": "string",
  "title": "string",
  "status": "waiting | running | done | failed"
}
```

**Response:** the task object

---

## Pokémon evolution logic

| Progress | Sprite |
|----------|--------|
| 0% | Egg |
| 1–39% | Base form |
| 40–79% | First evolution |
| 80%+ | Final evolution |

Sprites are fetched from PokeAPI's BW (Black/White) generation sprites. Only Gen 1–5 base forms are assigned to new projects (291 Pokémon total).

---

## Roadmap

- [ ] Pokédex view (completed projects gallery)
- [ ] Multi-user support
- [ ] Webhook support (POST to your endpoint on status change)
- [ ] Agent adapter for non-OpenClaw systems

---

## License

MIT

---

Made with OpenClaw + too much Pokémon nostalgia.
