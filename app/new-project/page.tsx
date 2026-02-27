'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DarkraiHeader } from '@/components/Darkrai'
import Link from 'next/link'

export default function NewProject() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <DarkraiHeader />
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-white font-mono text-xs">← BACK</Link>
          <h2 className="text-xs font-mono text-gray-500 tracking-widest">NEW PROJECT</h2>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">PROJECT NAME</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. revua 번역 배치 3차"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">DESCRIPTION <span className="text-gray-600">(optional)</span></label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 font-mono text-sm text-white h-20 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="What are the agents doing?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'CREATING...' : 'CREATE + ASSIGN POKÉMON'}
          </button>
        </form>
      </div>
    </main>
  )
}
