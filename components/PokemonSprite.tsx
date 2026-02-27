'use client'
import Image from 'next/image'
import { useTheme } from '@/lib/theme'
import { getEvolutionStage, getActualPokemonId, getSpriteUrl, EGG_SPRITE, isAbandoned, shouldRevealPokemon } from '@/lib/pokemon'

interface Props {
  pokemonId: number
  progress: number
  lastUpdatedAt: string
  size?: number
  elevated?: boolean  // 카드 열렸을 때 앞으로 나오는 효과
}

export function PokemonSprite({ pokemonId, progress, lastUpdatedAt, size = 80, elevated = false }: Props) {
  const { theme } = useTheme()
  const stage = getEvolutionStage(progress)
  const abandoned = isAbandoned(lastUpdatedAt)
  const revealed = shouldRevealPokemon(progress)
  const actualId = getActualPokemonId(pokemonId, progress)
  const src = !revealed || stage === 0 ? EGG_SPRITE : getSpriteUrl(actualId)
  const cardBg = theme === 'dark' ? '#111827' : '#ffffff'
  const outline = `drop-shadow(1px 0 0 ${cardBg}) drop-shadow(-1px 0 0 ${cardBg}) drop-shadow(0 1px 0 ${cardBg}) drop-shadow(0 -1px 0 ${cardBg})`
  // 열리면 그림자 깊어지면서 앞으로 나온 느낌
  const elevation = elevated
    ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.6)) drop-shadow(0 2px 4px rgba(0,229,255,0.15))'
    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={abandoned ? 'opacity-40 grayscale' : ''}>
        <Image
          src={src}
          alt={`pokemon-${actualId}`}
          width={size}
          height={size}
          style={{
            imageRendering: 'pixelated',
            filter: `${outline} ${elevation}`,
            transition: 'filter 0.3s ease',
          }}
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
