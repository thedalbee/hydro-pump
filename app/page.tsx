'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from '@/components/ProjectCard'
import { DarkraiHeader } from '@/components/Darkrai'
import Link from 'next/link'

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

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects().then(setProjects)

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects().then(setProjects)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchProjects().then(setProjects)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const active = projects.filter(p => p.status === 'active')
  const done = projects.filter(p => p.status === 'done')
  const paused = projects.filter(p => p.status === 'paused')
  const archived = projects.filter(p => p.status === 'archived' || p.status === 'abandoned')

  return (
    <main className="min-h-screen bg-gray-950">
      <DarkraiHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs text-gray-500 tracking-widest ui-sans">
            ACTIVE {active.length > 0 && <span className="text-cyan-400">({active.length})</span>}
          </h2>
          <Link
            href="/new-project"
            className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1.5 rounded transition-colors ui-sans"
          >
            + NEW PROJECT
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm italic">
            No active projects.<br />Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(p => <ProjectCard key={p.id} project={p} onUpdate={() => fetchProjects().then(setProjects)} />)}
          </div>
        )}

        {done.length > 0 && (
          <>
            <h2 className="text-xs text-gray-500 tracking-widest mt-10 mb-4 ui-sans">
              POKÉDEX <span className="text-green-400">({done.length})</span>
            </h2>
            <div className="space-y-3">
              {done.map(p => <ProjectCard key={p.id} project={p} onUpdate={() => fetchProjects().then(setProjects)} />)}
            </div>
          </>
        )}

        {paused.length > 0 && (
          <>
            <h2 className="text-xs text-gray-500 tracking-widest mt-10 mb-4 ui-sans">
              PAUSED <span className="text-yellow-400">({paused.length})</span>
            </h2>
            <div className="space-y-3 opacity-60">
              {paused.map(p => <ProjectCard key={p.id} project={p} onUpdate={() => fetchProjects().then(setProjects)} />)}
            </div>
          </>
        )}

        {archived.length > 0 && (
          <>
            <h2 className="text-xs text-gray-500 tracking-widest mt-10 mb-4 ui-sans">
              ARCHIVED <span className="text-gray-500">({archived.length})</span>
            </h2>
            <div className="space-y-3 opacity-40">
              {archived.map(p => <ProjectCard key={p.id} project={p} onUpdate={() => fetchProjects().then(setProjects)} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
