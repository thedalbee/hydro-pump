# Aqua Jet MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** OpenClaw 에이전트 모니터링 대시보드. 프로젝트마다 포켓몬 1마리 배정, 진행도에 따라 진화, 완료 시 도감 등록.

**Architecture:** Next.js App Router + Supabase (DB + Realtime). 달비님이 대시보드에서 프로젝트 생성 → 에이전트가 httpx로 Supabase에 상태 write → 대시보드 실시간 반영. LLM은 실제 작업에만 개입, UI/DB/로직은 전부 코드로 처리.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Realtime), PokeAPI sprites, Vercel 배포

---

## Task 1: Supabase 스키마 세팅

**Files:**
- Create: `supabase/schema.sql`

**Step 1: schema.sql 작성**

```sql
-- projects 테이블
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  pokemon_id int not null,
  status text not null default 'active' check (status in ('active', 'done', 'abandoned')),
  created_at timestamptz default now(),
  last_updated_at timestamptz default now()
);

-- tasks 테이블
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  agent_label text not null,
  title text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  started_at timestamptz,
  ended_at timestamptz,
  result text,
  created_at timestamptz default now()
);

-- used_pokemon 테이블 (도감 중복 방지)
create table used_pokemon (
  pokemon_id int primary key,
  project_id uuid references projects(id),
  registered_at timestamptz default now()
);

-- Realtime 활성화
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
```

**Step 2: Supabase 대시보드에서 실행**
- SQL Editor → 위 스키마 붙여넣기 → Run

**Step 3: 환경변수 메모**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Task 2: Next.js 프로젝트 초기화

**Files:**
- Create: `aqua-jet/` (프로젝트 루트)

**Step 1: 프로젝트 생성**
```bash
cd /root/.openclaw/workspace/projects
npx create-next-app@latest aqua-jet \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*"
cd aqua-jet
```

**Step 2: 의존성 설치**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 3: .env.local 작성**
```
NEXT_PUBLIC_SUPABASE_URL=<Task 1에서 메모한 값>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Task 1에서 메모한 값>
```

**Step 4: Supabase 클라이언트 작성**

`lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Step 5: 실행 확인**
```bash
npm run dev
# http://localhost:3000 접속 확인
```

**Step 6: Commit**
```bash
git init && git add . && git commit -m "feat: init aqua-jet next.js project"
```

---

## Task 3: 포켓몬 유틸리티

**Files:**
- Create: `lib/pokemon.ts`

**Step 1: pokemon.ts 작성**

```typescript
// 사용 중인 포켓몬 제외하고 랜덤 배정
export async function assignRandomPokemon(usedIds: number[]): Promise<number> {
  const MAX = 151 // Gen 1만 (나중에 확장 가능)
  const available = Array.from({ length: MAX }, (_, i) => i + 1)
    .filter(id => !usedIds.includes(id))
  if (available.length === 0) throw new Error('모든 포켓몬이 이미 배정됨')
  return available[Math.floor(Math.random() * available.length)]
}

// 진행도 → 진화 단계 (0=알, 1=1단계, 2=2단계, 3=최종)
export function getEvolutionStage(progress: number): 0 | 1 | 2 | 3 {
  if (progress === 0) return 0
  if (progress < 50) return 1
  if (progress < 100) return 2
  return 3
}

// 스프라이트 URL (GBA 픽셀 스타일)
export function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${pokemonId}.png`
}

// 알 스프라이트
export const EGG_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystery-egg.png'

// 방치 여부 (14일)
export function isAbandoned(lastUpdatedAt: string): boolean {
  const diff = Date.now() - new Date(lastUpdatedAt).getTime()
  return diff > 14 * 24 * 60 * 60 * 1000
}
```

**Step 2: Commit**
```bash
git add lib/pokemon.ts && git commit -m "feat: add pokemon utility functions"
```

---

## Task 4: API Routes

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`
- Create: `app/api/tasks/route.ts`

**Step 1: app/api/projects/route.ts**
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { assignRandomPokemon } from '@/lib/pokemon'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: 프로젝트 목록
export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

// POST: 프로젝트 생성
export async function POST(req: Request) {
  const { name, description } = await req.json()

  // 사용 중인 포켓몬 ID 조회
  const { data: used } = await supabase.from('used_pokemon').select('pokemon_id')
  const usedIds = used?.map(u => u.pokemon_id) ?? []

  // 랜덤 포켓몬 배정
  const pokemonId = await assignRandomPokemon(usedIds)

  // 프로젝트 생성
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, description, pokemon_id: pokemonId })
    .select()
    .single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  // 도감 등록
  await supabase.from('used_pokemon').insert({ pokemon_id: pokemonId, project_id: project.id })

  return NextResponse.json(project)
}
```

**Step 2: app/api/tasks/route.ts (에이전트용)**
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: 태스크 생성/업데이트 (에이전트가 호출)
export async function POST(req: Request) {
  const body = await req.json()
  // { project_id, agent_label, title, status, result? }

  const { data, error } = await supabase
    .from('tasks')
    .upsert(body, { onConflict: 'agent_label,project_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  // 프로젝트 진행도 자동 계산
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', body.project_id)

  const total = tasks?.length ?? 0
  const done = tasks?.filter(t => t.status === 'done').length ?? 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  await supabase
    .from('projects')
    .update({ progress, last_updated_at: new Date().toISOString() })
    .eq('id', body.project_id)

  return NextResponse.json(data)
}
```

**Step 3: Commit**
```bash
git add app/api && git commit -m "feat: add project and task API routes"
```

---

## Task 5: 포켓몬 카드 컴포넌트

**Files:**
- Create: `components/PokemonSprite.tsx`
- Create: `components/ProjectCard.tsx`

**Step 1: PokemonSprite.tsx**
```typescript
'use client'
import Image from 'next/image'
import { getEvolutionStage, getSpriteUrl, EGG_SPRITE, isAbandoned } from '@/lib/pokemon'

interface Props {
  pokemonId: number
  progress: number
  lastUpdatedAt: string
}

export function PokemonSprite({ pokemonId, progress, lastUpdatedAt }: Props) {
  const stage = getEvolutionStage(progress)
  const abandoned = isAbandoned(lastUpdatedAt)
  const src = stage === 0 ? EGG_SPRITE : getSpriteUrl(pokemonId)

  return (
    <div className="relative flex flex-col items-center">
      <div className={abandoned ? 'opacity-50 grayscale' : ''}>
        <Image
          src={src}
          alt={`pokemon-${pokemonId}`}
          width={96}
          height={96}
          className="pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {abandoned && (
        <span className="absolute -top-4 right-0 text-lg animate-bounce">💤</span>
      )}
    </div>
  )
}
```

**Step 2: ProjectCard.tsx**
```typescript
'use client'
import { PokemonSprite } from './PokemonSprite'

interface Task {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  agent_label: string
}

interface Project {
  id: string
  name: string
  progress: number
  pokemon_id: number
  status: string
  last_updated_at: string
  tasks: Task[]
}

const STATUS_COLOR = {
  queued: 'text-gray-400',
  running: 'text-cyan-400 animate-pulse',
  done: 'text-green-400',
  failed: 'text-red-400',
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex gap-4">
      <PokemonSprite
        pokemonId={project.pokemon_id}
        progress={project.progress}
        lastUpdatedAt={project.last_updated_at}
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-mono font-bold">{project.name}</h3>
          <span className="text-xs text-gray-500">{project.progress}%</span>
        </div>
        {/* 진행도 바 */}
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        {/* 태스크 목록 */}
        <ul className="mt-3 space-y-1">
          {project.tasks.map(task => (
            <li key={task.id} className="flex items-center gap-2 text-xs font-mono">
              <span className={STATUS_COLOR[task.status]}>
                {task.status === 'running' ? '▶' : task.status === 'done' ? '✓' : task.status === 'failed' ? '✗' : '○'}
              </span>
              <span className="text-gray-300">{task.title}</span>
              <span className="text-gray-600 ml-auto">{task.agent_label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

**Step 3: Commit**
```bash
git add components && git commit -m "feat: add PokemonSprite and ProjectCard components"
```

---

## Task 6: 메인 대시보드 페이지

**Files:**
- Modify: `app/page.tsx`
- Create: `app/new-project/page.tsx`
- Create: `components/Blastoise.tsx`

**Step 1: components/Blastoise.tsx (마스코트 헤더)**
```typescript
export function BlastoiseHeader() {
  return (
    <header className="flex items-center gap-4 py-6 px-4 border-b border-gray-800">
      <img
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/491.png"
        alt="blastoise"
        width={64}
        height={64}
        style={{ imageRendering: 'pixelated' }}
      />
      <div>
        <h1 className="text-2xl font-mono font-bold text-white tracking-tight">Aqua Jet</h1>
        <p className="text-xs text-gray-500 font-mono">OpenClaw Agent Monitor</p>
      </div>
    </header>
  )
}
```

**Step 2: app/page.tsx**
```typescript
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from '@/components/ProjectCard'
import { BlastoiseHeader } from '@/components/Blastoise'
import Link from 'next/link'

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    // 초기 로드
    supabase
      .from('projects')
      .select('*, tasks(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProjects(data ?? []))

    // Realtime 구독
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        supabase.from('projects').select('*, tasks(*)').order('created_at', { ascending: false })
          .then(({ data }) => setProjects(data ?? []))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('projects').select('*, tasks(*)').order('created_at', { ascending: false })
          .then(({ data }) => setProjects(data ?? []))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const active = projects.filter(p => p.status === 'active')
  const done = projects.filter(p => p.status === 'done')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <BlastoiseHeader />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-mono text-gray-400">ACTIVE ({active.length})</h2>
          <Link href="/new-project" className="text-xs font-mono bg-cyan-500 text-black px-3 py-1 rounded hover:bg-cyan-400">
            + NEW PROJECT
          </Link>
        </div>
        <div className="space-y-3">
          {active.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
        {done.length > 0 && (
          <>
            <h2 className="text-sm font-mono text-gray-400 mt-8 mb-4">POKÉDEX ({done.length})</h2>
            <div className="space-y-3">
              {done.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
```

**Step 3: app/new-project/page.tsx**
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProject() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="font-mono font-bold text-lg">NEW PROJECT</h2>
        <input
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 font-mono text-sm text-white"
          placeholder="Project name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 font-mono text-sm text-white h-24"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button type="submit" className="w-full bg-cyan-500 text-black font-mono font-bold py-2 rounded hover:bg-cyan-400">
          CREATE + ASSIGN POKÉMON
        </button>
      </form>
    </main>
  )
}
```

**Step 4: Commit**
```bash
git add app components && git commit -m "feat: add dashboard and new project pages"
```

---

## Task 7: Vercel 배포

**Step 1: GitHub 레포 생성**
```bash
gh repo create dalbee-ship-it/aqua-jet --public --source=. --push
```

**Step 2: Vercel 연결**
```bash
npx vercel --token <VERCEL_TOKEN>
# 프로젝트명: aqua-jet
```

**Step 3: 환경변수 Vercel에 등록**
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Step 4: 배포**
```bash
npx vercel --prod
```

---

## Task 8: 에이전트 연동 스니펫

**Files:**
- Create: `docs/agent-integration.md`

에이전트 프롬프트에 붙여넣을 스니펫:

```python
# 작업 시작 시
import httpx
httpx.post(
  "https://aqua-jet.vercel.app/api/tasks",
  json={
    "project_id": "PROJECT_UUID",
    "agent_label": "t-mcp-servers",
    "title": "claude-code-mcp-servers 번역",
    "status": "running"
  }
)

# 완료 시
httpx.post(
  "https://aqua-jet.vercel.app/api/tasks",
  json={
    "project_id": "PROJECT_UUID",
    "agent_label": "t-mcp-servers",
    "title": "claude-code-mcp-servers 번역",
    "status": "done",
    "result": "ID=617 삽입 완료"
  }
)
```

**Step 5: Commit**
```bash
git add docs && git commit -m "docs: add agent integration guide"
```

---

## 완료 기준
- [ ] Supabase 스키마 적용
- [ ] 프로젝트 생성 시 랜덤 포켓몬 배정 (중복 없음)
- [ ] 대시보드에서 실시간 진행도 확인
- [ ] 방치 시 💤 표시
- [ ] Vercel 배포 완료
- [ ] 에이전트 스니펫 동작 확인
