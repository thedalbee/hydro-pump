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

export function ProjectCard({ project }: { project: Project }) {
  const runningCount = project.tasks.filter(t => t.status === 'running').length

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-gray-600 transition-colors">
      <PokemonSprite
        pokemonId={project.pokemon_id}
        progress={project.progress}
        lastUpdatedAt={project.last_updated_at}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-white font-mono font-bold text-sm truncate">{project.name}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {runningCount > 0 && (
              <span className="text-xs text-cyan-400 font-mono animate-pulse">{runningCount} running</span>
            )}
            <span className="text-xs text-gray-400 font-mono">{project.progress}%</span>
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        {/* 태스크 목록 */}
        {project.tasks.length > 0 && (
          <ul className="mt-3 space-y-1">
            {project.tasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 text-xs font-mono">
                <span className={STATUS_COLOR[task.status]}>{STATUS_ICON[task.status]}</span>
                <span className="text-gray-300 truncate">{task.title}</span>
                <span className="text-gray-600 ml-auto flex-shrink-0">{task.agent_label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
