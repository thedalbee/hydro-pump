'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from '@/components/ProjectCard'
import { BlastoiseHeader } from '@/components/Blastoise'

interface Project {
  id: string
  name: string
  progress: number
  pokemon_id: number
  status: string
  last_updated_at: string
  due_date: string | null
  tasks: { id: string; title: string; status: 'queued' | 'running' | 'done' | 'failed'; agent_label: string }[]
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects')
  if (!res.ok) return []
  return res.json()
}

const TABS = [
  { key: 'inprogress', label: '진행 중' },
  { key: 'done',       label: '완료' },
  { key: 'archived',   label: '보관' },
] as const

type TabKey = typeof TABS[number]['key']

const STATUS_DOT: Record<string, string> = {
  waiting: 'bg-gray-400',
  active:  'bg-cyan-400',
  issue:   'bg-orange-400',
}
const STATUS_LABEL: Record<string, string> = {
  waiting: '대기',
  active:  '진행',
  issue:   '이슈',
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('inprogress')

  const refresh = () => fetchProjects().then(setProjects)

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const STATUS_ORDER: Record<string, number> = { issue: 0, active: 1, waiting: 2 }
  const inprogress = projects
    .filter(p => ['waiting', 'active', 'issue'].includes(p.status))
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
  const done       = projects.filter(p => p.status === 'done')
  const archived   = projects.filter(p => p.status === 'archived')

  const counts: Record<TabKey, number> = { inprogress: inprogress.length, done: done.length, archived: archived.length }
  const current = { inprogress, done, archived }[tab]

  return (
    <main className="min-h-screen">
      <BlastoiseHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 탭 */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl ui-sans" style={{ background: 'var(--bg-input)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setExpandedId(null) }}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className="ml-1.5 text-xs" style={{ color: tab === t.key ? '#22d3ee' : 'var(--text-muted)' }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 진행 중 — 상태별 뱃지 */}
        {tab === 'inprogress' && inprogress.length > 0 && (
          <div className="flex gap-3 mb-4 ui-sans">
            {(['waiting','active','issue'] as const).map(s => {
              const count = inprogress.filter(p => p.status === s).length
              if (!count) return null
              return (
                <span key={s} className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                  {STATUS_LABEL[s]} {count}
                </span>
              )
            })}
          </div>
        )}

        {/* 카드 목록 */}
        {current.length === 0 ? (
          <p className="text-center py-20 text-sm italic text-muted ui-sans">
            {tab === 'inprogress' && '진행 중인 프로젝트가 없어요.'}
            {tab === 'done' && '아직 완료된 프로젝트가 없어요.'}
            {tab === 'archived' && '보관된 프로젝트가 없어요.'}
          </p>
        ) : (
          <div className="space-y-3" style={{ opacity: tab === 'archived' ? 0.5 : 1 }}>
            {current.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                expandedId={expandedId}
                onToggle={setExpandedId}
                onUpdate={refresh}
              />
            ))}
          </div>
        )}

      </div>
      {/* FAB — 우측 하단 고정 */}
      <button
        className="ui-sans fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold px-5 py-3 rounded-full shadow-lg transition-colors cursor-pointer text-sm z-50 opacity-50 cursor-not-allowed"
        disabled
        title="텔레그램으로 새 프로젝트 추가"
      >
        + New Project
      </button>
    </main>
  )
}
