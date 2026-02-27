import Link from 'next/link'

export function DarkraiHeader() {
  return (
    <header className="border-b border-gray-800">
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
            className="font-bold text-white"
            style={{
              fontSize: '2.2rem',
              letterSpacing: '0.1em',
              transform: 'scaleY(0.6)',
              transformOrigin: 'left center',
              display: 'inline-block',
              lineHeight: 1,
            }}
          >SHADOWBALL</h1>
          <p className="text-xs text-gray-500 italic tracking-widest ui-sans" style={{ marginTop: '-2px' }}>OpenClaw Agent Monitor</p>
        </div>
        <Link
          href="/new-project"
          className="ui-sans text-xs bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          + New Project
        </Link>
      </div>
    </header>
  )
}
