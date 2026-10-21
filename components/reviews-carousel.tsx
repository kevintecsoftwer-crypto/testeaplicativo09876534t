'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

type Review = { id: string; author: string; rating: number; text: string; date?: string; source: 'Google' }

type Props = {
  reviews: Review[]
  loading: boolean
  source?: string
  syncedAutomatically: boolean
  onOpenMaps: () => void
}

export function ReviewsCarousel({ reviews, loading, source, syncedAutomatically, onOpenMaps }: Props) {
  const [index, setIndex] = React.useState(0)
  const current = reviews[index]

  React.useEffect(() => {
    if (reviews.length && index >= reviews.length) setIndex(0)
  }, [index, reviews.length])

  return (
    <div id="avaliacoes" className="scroll-mt-24 rounded-2xl border border-[#C4CBCD] bg-[#F5F6F5] p-5 sm:rounded-3xl sm:p-6" aria-roledescription="carrossel" aria-label="O que os clientes dizem sobre a Centro Cell">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1 text-[#C92743]" aria-label="Avaliações do Google">{Array.from({ length: 5 }, (_, star) => <Star key={star} className="size-4 fill-current" />)}</div><span className="text-xs font-semibold text-[#626B70]">Google</span></div>
      <h3 className="mt-4 text-lg font-bold">O que os clientes dizem sobre a Centro Cell</h3>
      {loading ? <p className="mt-4 rounded-xl bg-[#E9ECED] p-5 text-sm text-[#626B70]">Carregando avaliações verificadas...</p> : current ? <div className="mt-4" role="group" aria-roledescription="slide" aria-label={`Avaliação ${index + 1} de ${reviews.length}`}><div className="flex items-center justify-between gap-3"><strong>{current.author}</strong><span className="text-xs text-[#626B70]">{current.date ?? 'Data não informada'}</span></div><div className="mt-2 flex items-center gap-1 text-[#C92743]" aria-label={`${current.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, star) => <Star key={star} className={`size-4 ${star < current.rating ? 'fill-current' : ''}`} />)}</div><p className="mt-4 text-sm leading-6 text-[#30363A]">“{current.text}”</p><div className="mt-5 flex items-center justify-between gap-3"><button type="button" onClick={() => setIndex((index - 1 + reviews.length) % reviews.length)} aria-label="Avaliação anterior" className="rounded-full border border-[#C4CBCD] p-2 hover:bg-white"><ChevronLeft className="size-4" /></button><div className="flex items-center gap-1.5" aria-label={`Slide ${index + 1} de ${reviews.length}`}>{reviews.map((review, dot) => <button key={review.id} type="button" onClick={() => setIndex(dot)} aria-label={`Ir para avaliação ${dot + 1}`} aria-current={dot === index} className={`size-2 rounded-full transition ${dot === index ? 'bg-[#C92743]' : 'bg-[#C4CBCD]'}`} />)}</div><button type="button" onClick={() => setIndex((index + 1) % reviews.length)} aria-label="Próxima avaliação" className="rounded-full border border-[#C4CBCD] p-2 hover:bg-white"><ChevronRight className="size-4" /></button></div></div> : <div className="mt-4 rounded-xl border border-[#C4CBCD] bg-[#E9ECED] p-5 text-sm leading-6 text-[#626B70]"><strong className="block text-[#30363A]">Nenhuma avaliação sincronizada ainda</strong><span className="mt-1 block">As avaliações só aparecem aqui quando forem cadastradas pela Centro Cell como conteúdo verificado. Não exibimos comentários fictícios.</span></div>}
      <div className="mt-5 border-t border-[#C4CBCD] pt-4 text-xs leading-5 text-[#626B70]"><span className="block">Fonte: {syncedAutomatically ? 'Google Places (sincronização automática)' : source ?? 'Cadastro verificado da Centro Cell'}</span><span className="block">Centro Cell · Rua XV de Novembro, 257 · Centro · Sorocaba — SP</span><button type="button" onClick={onOpenMaps} className="mt-2 font-semibold text-[#C92743] underline underline-offset-4">Consultar perfil oficial no Google Maps</button></div>
    </div>
  )
}
