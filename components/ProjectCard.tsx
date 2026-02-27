'use client'
import { useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { StatusPicker } from './StatusPicker'

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
  due_date: string | null
  tasks: Task[]
}

function formatDue(due: string | null) {
  if (!due) return null
  const d = new Date(due)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { text: `${Math.abs(diff)}일 초과`, color: 'text-red-400' }
  if (diff === 0) return { text: '오늘 마감', color: 'text-red-400' }
  if (diff <= 3) return { text: `D-${diff}`, color: 'text-orange-400' }
  return { text: `D-${diff}`, color: 'text-muted' }
}

const TASK_STATUS_COLOR: Record<string, string> = {
  queued:  'text-gray-500',
  running: 'text-cyan-400 animate-pulse',
  done:    'text-green-400',
  failed:  'text-red-400',
}
const TASK_STATUS_ICON: Record<string, string> = {
  queued: '○', running: '▶', done: '✓', failed: '✗',
}


export function ProjectCard({
  project, expandedId, onToggle, onUpdate,
}: {
  project: Project
  expandedId: string | null
  onToggle: (id: string | null) => void
  onUpdate: () => void
}) {
  const expanded = expandedId === project.id
  const [hovered, setHovered] = useState(false)
  const runningCount = project.tasks.filter(t => t.status === 'running').length



  // 체크 안 된 것 먼저 (running → queued → failed), 체크된 것 아래 (checked_at 순)
  const sortedTasks = [...project.tasks].sort((a, b) => {
    const isDoneA = a.status === 'done'
    const isDoneB = b.status === 'done'
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1
    if (!isDoneA) {
      const order = { running: 0, queued: 1, failed: 2 }
      return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9)
    }
    return 0 // done끼리는 서버 순서 유지 (체크한 순)
  })

  async function changeStatus(status: string) {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }

  return (
    <div
      className={`card ${expanded ? 'expanded' : ''}`}
      style={{ boxShadow: hovered && !expanded ? '0 0 0 1px var(--border-hover)' : undefined }}
    >
      {/* 카드 헤더 */}
      <div
        className="p-4 cursor-pointer select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onToggle(expanded ? null : project.id)}
      >
        <div className="flex gap-3 items-center">
          {/* 포켓몬 */}
          <div className="flex-shrink-0">
            <PokemonSprite
              pokemonId={project.pokemon_id}
              progress={project.progress}
              lastUpdatedAt={project.last_updated_at}
              size={72}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <StatusPicker current={project.status} onChange={changeStatus} />
              <div className="flex items-center gap-2 ui-sans">
                {runningCount > 0 && <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>}
                <span className="text-muted text-sm">{expanded ? '▲' : '▼'}</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-1 mb-2">
              <h3 className="font-bold text-primary leading-tight" style={{ fontSize: '1rem' }}>
                {project.name}
              </h3>
              {(() => {
                const due = formatDue(project.due_date)
                return due ? (
                  <span className={`ui-sans text-xs flex-shrink-0 mt-0.5 ${due.color}`}>{due.text}</span>
                ) : null
              })()}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 progress-track rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${project.progress}%` }} />
              </div>
              <span className="ui-sans text-xs text-muted flex-shrink-0">{project.progress}%</span>
            </div>

            {!expanded && sortedTasks.length > 0 && (() => {
              const topTask = sortedTasks[0]
              return (
                <ul className="mt-1.5">
                  <li className="flex items-center gap-1.5 ui-sans" style={{ fontSize: '0.75rem' }}>
                    {topTask.status === 'running' ? (
                      <span className="flex-shrink-0 text-cyan-400 animate-pulse text-xs">▶</span>
                    ) : (
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center rounded-[3px] border"
                        style={{
                          width: '12px', height: '12px', fontSize: '9px', lineHeight: 1,
                          borderColor: topTask.status === 'done' ? '#4ade80' : 'var(--border-hover)',
                          background: topTask.status === 'done' ? '#4ade80' : 'transparent',
                          color: topTask.status === 'done' ? '#000' : 'transparent',
                        }}
                      >
                        {topTask.status === 'done' ? '✓' : ''}
                      </span>
                    )}
                    <span className={`truncate ${topTask.status === 'done' ? 'text-muted line-through' : 'text-secondary'}`}>
                      {topTask.title}
                    </span>
                  </li>
                </ul>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 펼쳐진 영역 */}
      {expanded && (
        <div className="max-h-72 overflow-y-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <ul className="px-4 py-3 space-y-2">
            {sortedTasks.map(task => (
              <li
                key={task.id}
                className="flex items-center gap-2 ui-sans"
                style={{ fontSize: '0.8rem' }}
              >
                {task.status === 'running' ? (
                  <span className="flex-shrink-0 text-cyan-400 animate-pulse" style={{ fontSize: '0.7rem' }}>▶</span>
                ) : (
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center rounded-[3px] border transition-colors"
                    style={{
                      width: '13px', height: '13px', fontSize: '9px', lineHeight: 1,
                      borderColor: task.status === 'done' ? '#4ade80' : 'var(--border-hover)',
                      background: task.status === 'done' ? '#4ade80' : 'transparent',
                      color: task.status === 'done' ? '#000' : 'transparent',
                    }}
                  >
                    {task.status === 'done' ? '✓' : ''}
                  </span>
                )}
                <span className={`${task.status === 'done' ? 'text-muted line-through' : 'text-secondary'}`}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
