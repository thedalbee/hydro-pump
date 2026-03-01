'use client'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export function BlastoiseHeader() {
  const { theme, toggle } = useTheme()

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/491.png"
          alt="blastoise"
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
            Active Agent Monitor
          </p>
        </div>
        <button
          onClick={toggle}
          className="ui-sans text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? '☀︎' : '☽'}
        </button>
      </div>
    </header>
  )
}
