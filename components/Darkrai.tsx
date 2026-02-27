'use client'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export function DarkraiHeader() {
  const { theme, toggle } = useTheme()

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/491.png"
          alt="darkrai"
          width={52}
          height={52}
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="flex-1">
          <h1
            className="font-bold"
            style={{
              fontSize: '2.2rem',
              letterSpacing: '0.1em',
              transform: 'scaleY(0.6)',
              transformOrigin: 'left center',
              display: 'inline-block',
              lineHeight: 1,
              color: 'var(--text-primary)',
            }}
          >SHADOWBALL</h1>
          <p className="text-xs italic tracking-widest ui-sans" style={{ color: 'var(--text-muted)', marginTop: '-2px' }}>
            OpenClaw Agent Monitor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 다크/라이트 토글 */}
          <button
            onClick={toggle}
            className="ui-sans text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            {theme === 'dark' ? '☀︎' : '☽'}
          </button>
          <Link
            href="/new-project"
            className="ui-sans text-xs bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            + New Project
          </Link>
        </div>
      </div>
    </header>
  )
}
