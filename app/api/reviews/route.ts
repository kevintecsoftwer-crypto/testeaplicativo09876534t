import { NextResponse } from 'next/server'

export const revalidate = 3600

type Review = {
  id: string
  author: string
  rating: number
  text: string
  date?: string
  source: 'Google'
}

export async function GET() {
  const rawReviews = process.env.CENTRO_CELL_VERIFIED_REVIEWS_JSON
  let reviews: Review[] = []

  if (rawReviews) {
    try {
      const parsed = JSON.parse(rawReviews) as unknown
      if (Array.isArray(parsed)) {
        reviews = parsed
          .filter((item): item is Omit<Review, 'id' | 'source'> => {
            if (!item || typeof item !== 'object') return false
            const value = item as Record<string, unknown>
            return typeof value.author === 'string' && typeof value.text === 'string' && typeof value.rating === 'number'
          })
          .map((review, index) => ({
            id: `${review.author}-${review.date ?? index}`,
            author: review.author,
            rating: Math.max(1, Math.min(5, review.rating)),
            text: review.text,
            date: typeof review.date === 'string' ? review.date : undefined,
            source: 'Google' as const,
          }))
          .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      }
    } catch {
      reviews = []
    }
  }

  return NextResponse.json({
    business: 'Centro Cell — Rua XV de Novembro, 257 — Centro — Sorocaba, SP',
    source: 'Avaliações verificadas fornecidas pela Centro Cell',
    syncedAutomatically: false,
    reviews,
  })
}
