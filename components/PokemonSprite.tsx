'use client'
import Image from 'next/image'
import { getEvolutionStage, getSpriteUrl, EGG_SPRITE, isAbandoned } from '@/lib/pokemon'

interface Props {
  pokemonId: number
  progress: number
  lastUpdatedAt: string
}

export function PokemonSprite({ pokemonId, progress, lastUpdatedAt }: Props) {
  const stage = getEvolutionStage(progress)
  const abandoned = isAbandoned(lastUpdatedAt)
  const src = stage === 0 ? EGG_SPRITE : getSpriteUrl(pokemonId)

  return (
    <div className="relative flex flex-col items-center w-24 h-24 flex-shrink-0">
      <div className={`w-full h-full flex items-center justify-center ${abandoned ? 'opacity-40 grayscale' : ''}`}>
        <Image
          src={src}
          alt={`pokemon-${pokemonId}`}
          width={80}
          height={80}
          style={{ imageRendering: 'pixelated' }}
          unoptimized
        />
      </div>
      {abandoned && (
        <span className="absolute -top-2 right-0 text-base animate-bounce select-none">💤</span>
      )}
    </div>
  )
}
