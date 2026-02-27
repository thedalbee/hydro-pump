'use client'
import Image from 'next/image'
import { useTheme } from '@/lib/theme'
import { getEvolutionStage, getActualPokemonId, getSpriteUrl, EGG_SPRITE, isAbandoned, shouldRevealPokemon } from '@/lib/pokemon'

interface Props {
  pokemonId: number   // DB에 저장된 기본형 ID
  progress: number
  lastUpdatedAt: string
  size?: number
}

export function PokemonSprite({ pokemonId, progress, lastUpdatedAt, size = 80 }: Props) {
  const { theme } = useTheme()
  const stage = getEvolutionStage(progress)
  const abandoned = isAbandoned(lastUpdatedAt)
  const revealed = shouldRevealPokemon(progress)
  const actualId = getActualPokemonId(pokemonId, progress)
  const src = !revealed || stage === 0 ? EGG_SPRITE : getSpriteUrl(actualId)
  const cardBg = theme === 'dark' ? '#111827' : '#ffffff'
  const outline = `drop-shadow(1px 0 0 ${cardBg}) drop-shadow(-1px 0 0 ${cardBg}) drop-shadow(0 1px 0 ${cardBg}) drop-shadow(0 -1px 0 ${cardBg})`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={abandoned ? 'opacity-40 grayscale' : ''}>
        <Image
          src={src}
          alt={`pokemon-${actualId}`}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', filter: outline }}
          unoptimized
        />
      </div>
      {abandoned && (
        <span className="absolute -top-1 -right-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <text x="2" y="18" fontSize="16" fill="#9ca3af" fontFamily="sans-serif" fontWeight="bold">z</text>
          </svg>
        </span>
      )}
    </div>
  )
}
