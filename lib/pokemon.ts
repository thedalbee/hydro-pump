export async function assignRandomPokemon(usedIds: number[]): Promise<number> {
  const MAX = 151
  const available = Array.from({ length: MAX }, (_, i) => i + 1).filter(id => !usedIds.includes(id))
  if (available.length === 0) throw new Error('모든 포켓몬이 이미 배정됨')
  return available[Math.floor(Math.random() * available.length)]
}

export function getEvolutionStage(progress: number): 0 | 1 | 2 | 3 {
  if (progress === 0) return 0
  if (progress < 50) return 1
  if (progress < 100) return 2
  return 3
}

export function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${pokemonId}.png`
}

export const EGG_SPRITE = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystery-egg.png`

export function isAbandoned(lastUpdatedAt: string): boolean {
  return Date.now() - new Date(lastUpdatedAt).getTime() > 14 * 24 * 60 * 60 * 1000
}
