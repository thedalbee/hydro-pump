import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { assignRandomPokemon } from '@/lib/pokemon'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name, description } = await req.json()

  const { data: used } = await supabase.from('used_pokemon').select('pokemon_id')
  const usedIds = used?.map((u: { pokemon_id: number }) => u.pokemon_id) ?? []
  const pokemonId = await assignRandomPokemon(usedIds)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, description, pokemon_id: pokemonId })
    .select()
    .single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  await supabase.from('used_pokemon').insert({ pokemon_id: pokemonId, project_id: project.id })

  return NextResponse.json(project)
}
