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
        <h1 className="text-xl font-mono font-bold text-white tracking-widest">SHADOWBALL</h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">OpenClaw Agent Monitor</p>
      </div>
    </header>
  )
}
