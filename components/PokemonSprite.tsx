'use client'
import Image from 'next/image'
import { getEvolutionStage, getSpriteUrl, EGG_SPRITE, isAbandoned } from '@/lib/pokemon'

interface Props {
  pokemonId: number
  progress: number
  lastUpdatedAt: string
  size?: number
}

export function PokemonSprite({ pokemonId, progress, lastUpdatedAt, size = 80 }: Props) {
  const stage = getEvolutionStage(progress)
  const abandoned = isAbandoned(lastUpdatedAt)
  const src = stage === 0 ? EGG_SPRITE : getSpriteUrl(pokemonId)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={abandoned ? 'opacity-40 grayscale' : ''}>
        <Image
          src={src}
          alt={`pokemon-${pokemonId}`}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated' }}
          unoptimized
        />
      </div>
      {abandoned && (
        <span className="absolute -top-1 -right-1 ui-sans">
          {/* Zzz SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400 animate-bounce">
            <text x="2" y="18" fontSize="16" fill="currentColor" fontFamily="sans-serif" fontWeight="bold">z</text>
          </svg>
        </span>
      )}
    </div>
  )
}
