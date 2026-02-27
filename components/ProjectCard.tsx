'use client'
import { PokemonSprite } from './PokemonSprite'
import { ProjectMenu } from './ProjectMenu'

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

const STATUS_ICON: Record<string, string> = {
  queued: '○',
  running: '▶',
  done: '✓',
  failed: '✗',
}
const STATUS_COLOR: Record<string, string> = {
  queued: 'text-gray-500',
  running: 'text-cyan-400 animate-pulse',
  done: 'text-green-400',
  failed: 'text-red-400',
}

export function ProjectCard({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const runningCount = project.tasks.filter(t => t.status === 'running').length

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 hover:border-gray-600 transition-colors cursor-default">
      {/* 포켓몬 스프라이트 — 작게 */}
      <div className="flex-shrink-0 flex items-center">
        <PokemonSprite
          pokemonId={project.pokemon_id}
          progress={project.progress}
          lastUpdatedAt={project.last_updated_at}
          size={56}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* 상단: 이름 + 메뉴 */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-white font-bold text-sm truncate">{project.name}</h3>
          <div className="flex items-center gap-2 flex-shrink-0 ui-sans">
            {runningCount > 0 && (
              <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>
            )}
            <span className="text-xs text-gray-500">{project.progress}%</span>
            <ProjectMenu projectId={project.id} currentStatus={project.status} onUpdate={onUpdate} />
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        {/* 태스크 목록 — 최대 3개만 표시 */}
        {project.tasks.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {project.tasks.slice(0, 3).map(task => (
              <li key={task.id} className="flex items-center gap-1.5 text-xs ui-sans">
                <span className={`flex-shrink-0 ${STATUS_COLOR[task.status]}`}>{STATUS_ICON[task.status]}</span>
                <span className="text-gray-400 truncate">{task.title}</span>
                <span className="text-gray-600 ml-auto flex-shrink-0">{task.agent_label}</span>
              </li>
            ))}
            {project.tasks.length > 3 && (
              <li className="text-xs text-gray-600 ui-sans">+{project.tasks.length - 3} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
