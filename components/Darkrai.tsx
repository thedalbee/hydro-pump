export function DarkraiHeader() {
  return (
    <header className="flex items-center gap-4 py-5 px-6 border-b border-gray-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/491.png"
        alt="darkrai"
        width={56}
        height={56}
        style={{ imageRendering: 'pixelated' }}
      />
      <div>
        <h1
          className="font-bold text-white"
          style={{
            fontSize: '2rem',
            letterSpacing: '0.1em',
            transform: 'scaleY(0.6)',
            transformOrigin: 'left center',
            display: 'inline-block',
            lineHeight: 1,
          }}
        >SHADOWBALL</h1>
        <p className="text-xs text-gray-500 mt-1 italic tracking-widest">OpenClaw Agent Monitor</p>
      </div>
    </header>
  )
}
