'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PokemonSprite } from './PokemonSprite'

interface Task {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  agent_label: string
}

interface Log {
  id: string
  type: 'system' | 'agent' | 'user'
  message: string
  created_at: string
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

const STATUS_COLOR: Record<string, string> = {
  queued: 'text-gray-500',
  running: 'text-cyan-400 animate-pulse',
  done: 'text-green-400',
  failed: 'text-red-400',
}
const STATUS_ICON: Record<string, string> = {
  queued: '○', running: '▶', done: '✓', failed: '✗',
}
const ACTION_BUTTONS = [
  { status: 'done',      label: '완료', color: 'bg-green-500 hover:bg-green-400 text-black' },
  { status: 'paused',    label: '보류', color: 'bg-yellow-500 hover:bg-yellow-400 text-black' },
  { status: 'archived',  label: '보관', color: 'bg-gray-500 hover:bg-gray-400 text-white' },
  { status: 'abandoned', label: '폐기', color: 'bg-red-600 hover:bg-red-500 text-white' },
]
const LOG_TEXT: Record<string, string> = {
  system: 'text-secondary',
  agent: 'text-cyan-400',
  user: 'text-primary',
}
const LOG_PREFIX: Record<string, string> = { system: '·', agent: '▶', user: '›' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function ProjectCard({ project, expandedId, onToggle, onUpdate }: { project: Project; expandedId: string | null; onToggle: (id: string | null) => void; onUpdate: () => void }) {
  const expanded = expandedId === project.id
  const [hovered, setHovered] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const runningCount = project.tasks.filter(t => t.status === 'running').length

  useEffect(() => {
    if (!expanded) return
    fetch(`/api/logs?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))

    const channel = supabase
      .channel(`log-${project.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'logs',
        filter: `project_id=eq.${project.id}`
      }, payload => setLogs(prev => [...prev, payload.new as Log]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [expanded, project.id])

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, expanded])

  async function changeStatus(status: string) {
    setStatusLoading(status)
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setStatusLoading(null)
    onUpdate()
  }

  async function sendLog(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSending(true)
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, message: input.trim(), type: 'user' }),
    })
    setInput('')
    setSending(false)
  }

  const availableActions = ACTION_BUTTONS.filter(a => a.status !== project.status)

  return (
    <div
      className={`card ${expanded ? 'expanded' : ''}`}
      style={{ transform: hovered && !expanded ? 'scale(1.01)' : 'scale(1)' }}
    >
      {/* 카드 헤더 */}
      <div
        className="p-3 flex gap-3 cursor-pointer select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onToggle(expanded ? null : project.id)}
      >
        <div className="flex-shrink-0 flex items-center">
          <PokemonSprite
            pokemonId={project.pokemon_id}
            progress={project.progress}
            lastUpdatedAt={project.last_updated_at}
            size={56}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-primary font-bold text-sm truncate">{project.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0 ui-sans">
              {runningCount > 0 && <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>}
              <span className="text-xs text-muted">{project.progress}%</span>
              <span className="text-muted text-xs">{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
          <div className="mt-1.5 h-1 progress-track rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${project.progress}%` }} />
          </div>
          {!expanded && project.tasks.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {project.tasks.slice(0, 2).map(task => (
                <li key={task.id} className="flex items-center gap-1.5 text-xs ui-sans">
                  <span className={`flex-shrink-0 ${STATUS_COLOR[task.status]}`}>{STATUS_ICON[task.status]}</span>
                  <span className="text-secondary truncate">{task.title}</span>
                </li>
              ))}
              {project.tasks.length > 2 && <li className="text-xs text-muted ui-sans">+{project.tasks.length - 2} more</li>}
            </ul>
          )}
        </div>
      </div>

      {/* 펼쳐진 영역 */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* 로그 */}
          <div className="px-4 py-3 space-y-1.5 max-h-52 overflow-y-auto">
            {logs.length === 0
              ? <p className="ui-sans text-xs text-muted italic">아직 기록이 없어요.</p>
              : logs.map(log => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className={`ui-sans text-xs flex-shrink-0 mt-0.5 ${LOG_TEXT[log.type]}`}>{LOG_PREFIX[log.type]}</span>
                  <span className="ui-sans text-xs text-muted flex-shrink-0 w-10">{formatTime(log.created_at)}</span>
                  <span className={`text-sm leading-snug ui-sans ${LOG_TEXT[log.type]}`}>{log.message}</span>
                </div>
              ))
            }
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <form onSubmit={sendLog} className="flex gap-2 px-4 pb-3">
            <input
              className="input flex-1"
              placeholder="메모 또는 명령..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="ui-sans bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm"
            >→</button>
          </form>

          {/* 상태 변경 */}
          <div className="flex gap-1.5 px-4 pb-3">
            {availableActions.map(action => (
              <button
                key={action.status}
                onClick={() => changeStatus(action.status)}
                disabled={statusLoading !== null}
                className={`ui-sans text-xs font-semibold px-3 py-1 rounded-md cursor-pointer transition-colors ${action.color} disabled:opacity-50`}
              >
                {statusLoading === action.status ? '...' : action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
