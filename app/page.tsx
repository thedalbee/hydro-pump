'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from '@/components/ProjectCard'
import { DarkraiHeader } from '@/components/Darkrai'

interface Project {
  id: string
  name: string
  progress: number
  pokemon_id: number
  status: string
  last_updated_at: string
  tasks: { id: string; title: string; status: 'queued' | 'running' | 'done' | 'failed'; agent_label: string }[]
}

async function fetchProjects(): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .order('created_at', { ascending: false })
  return (data ?? []) as Project[]
}

const STATUS_LABEL: Record<string, string> = {
  waiting: '대기',
  active: '진행',
  issue: '이슈',
}
const STATUS_DOT: Record<string, string> = {
  waiting: 'bg-gray-400',
  active: 'bg-cyan-400',
  issue: 'bg-orange-400',
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  // 3그룹 분류
  const inProgress = projects.filter(p => ['waiting', 'active', 'issue'].includes(p.status))
  const done = projects.filter(p => p.status === 'done')
  const archived = projects.filter(p => p.status === 'archived')

  return (
    <main className="min-h-screen">
      <DarkraiHeader />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">

        {/* 그룹 1: 진행 중 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs tracking-widest ui-sans text-muted">진행 중</h2>
            {inProgress.length > 0 && (
              <div className="flex gap-2 ui-sans text-xs text-muted">
                {(['waiting','active','issue'] as const).map(s => {
                  const count = inProgress.filter(p => p.status === s).length
                  if (!count) return null
                  return (
                    <span key={s} className="flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                      {STATUS_LABEL[s]} {count}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          {inProgress.length === 0 ? (
            <p className="text-center py-12 text-sm italic text-muted ui-sans">진행 중인 프로젝트가 없어요.</p>
          ) : (
            <div className="space-y-3">
              {inProgress.map(p => (
                <ProjectCard key={p.id} project={p} expandedId={expandedId} onToggle={setExpandedId} onUpdate={refresh} />
              ))}
            </div>
          )}
        </section>

        {/* 그룹 2: 완료 — 포켓덱스 */}
        {done.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs tracking-widest ui-sans text-muted">포켓덱스</h2>
              <span className="ui-sans text-xs text-green-400">{done.length}</span>
            </div>
            <div className="space-y-3 opacity-80">
              {done.map(p => (
                <ProjectCard key={p.id} project={p} expandedId={expandedId} onToggle={setExpandedId} onUpdate={refresh} />
              ))}
            </div>
          </section>
        )}

        {/* 그룹 3: 보관 */}
        {archived.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs tracking-widest ui-sans text-muted">보관</h2>
              <span className="ui-sans text-xs text-muted">{archived.length}</span>
            </div>
            <div className="space-y-3 opacity-40">
              {archived.map(p => (
                <ProjectCard key={p.id} project={p} expandedId={expandedId} onToggle={setExpandedId} onUpdate={refresh} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
