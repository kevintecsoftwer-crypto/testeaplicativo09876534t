'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, MessageCircle, Star, X } from 'lucide-react'

const subjects = [
  'Orçamento rápido',
  'Atendimento urgente',
  'Acompanhar meu reparo',
  'Dúvida sobre um serviço',
  'Outro assunto',
]

const ratingLabels = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente']

type PreAtendimentoDialogProps = {
  open: boolean
  initialSubject?: string
  defaultName: string
  whatsappNumber: string
  onClose: () => void
  onNameConfirmed: (name: string) => void
}

export function PreAtendimentoDialog({ open, initialSubject, defaultName, whatsappNumber, onClose, onNameConfirmed }: PreAtendimentoDialogProps) {
  const [stage, setStage] = useState<1 | 2>(1)
  const [subject, setSubject] = useState('')
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setStage(1)
    setSubject(initialSubject || '')
    setName(defaultName)
    setDetails('')
    setRating(0)
    setComment('')
    setError('')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, initialSubject, defaultName, onClose])

  if (!open) return null

  function goToRating() {
    if (!subject) return setError('Escolha o assunto do seu contato.')
    if (!name.trim()) return setError('Informe seu nome para continuar.')
    setError('')
    setStage(2)
  }

  function sendToWhatsapp(skipRating = false) {
    if (!skipRating && !rating) return setError('Toque nas estrelas para avaliar ou pule esta etapa.')
    const lines = ['Olá, equipe Centro Cell! Vim pelo site.', '', `👤 Nome: ${name.trim()}`, `📌 Assunto: ${subject}`]
    if (details.trim()) lines.push(`📝 Detalhes: ${details.trim()}`)
    lines.push('')
    if (skipRating || !rating) {
      lines.push('⭐ Pré-atendimento: não avaliado')
    } else {
      lines.push(`⭐ Avaliação do pré-atendimento: ${rating}/5 (${ratingLabels[rating]})`)
      if (comment.trim()) lines.push(`💬 Comentário: ${comment.trim()}`)
    }
    onNameConfirmed(name.trim())
    window.open(`https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(lines.join('\n'))}&type=phone_number&app_absent=0`, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pre-atendimento-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white text-[#30363A] shadow-2xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E1E3E3] px-5 pb-4 pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C92743]">Pré-atendimento · {stage}/2</p>
            <h2 id="pre-atendimento-title" className="mt-1 text-xl font-black leading-tight tracking-tight text-pretty">
              {stage === 1 ? 'Como podemos ajudar?' : 'Como foi este pré-atendimento?'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar pré-atendimento" className="-mr-1 shrink-0 rounded-full p-2 text-[#626B70] hover:bg-[#F1F2F2] hover:text-[#30363A]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex h-1 w-full bg-[#E1E3E3]" aria-hidden="true">
          <div className={`h-full bg-[#C92743] transition-all ${stage === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {stage === 1 ? (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-bold">Assunto</legend>
                {subjects.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={subject === item}
                    onClick={() => { setSubject(item); setError('') }}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${subject === item ? 'border-[#C92743] bg-[#C92743]/5 text-[#C92743]' : 'border-[#C4CBCD] hover:border-[#626B70]'}`}
                  >
                    {item}
                    {subject === item && <Check className="size-4 shrink-0" />}
                  </button>
                ))}
              </fieldset>
              <label className="flex flex-col gap-1.5 text-sm font-bold">
                Seu nome
                <input
                  value={name}
                  onChange={(event) => { setName(event.target.value); setError('') }}
                  autoComplete="name"
                  placeholder="Como devemos te chamar?"
                  className="rounded-xl border border-[#C4CBCD] px-4 py-3 text-base font-normal outline-none focus:border-[#C92743] focus:ring-2 focus:ring-[#C92743]/20"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold">
                <span>Detalhes <span className="font-normal text-[#626B70]">(opcional)</span></span>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Ex.: iPhone 13 com tela quebrada"
                  className="resize-none rounded-xl border border-[#C4CBCD] px-4 py-3 text-base font-normal outline-none focus:border-[#C92743] focus:ring-2 focus:ring-[#C92743]/20"
                />
              </label>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[#626B70]">Sua opinião nos ajuda a deixar o atendimento cada vez mais rápido e simples.</p>
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F6F7F7] px-3 py-5">
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota do pré-atendimento">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                      onClick={() => { setRating(star); setError('') }}
                      className="rounded-md p-1 transition active:scale-90"
                    >
                      <Star className={`size-8 ${star <= rating ? 'fill-[#F5B301] text-[#F5B301]' : 'text-[#C4CBCD]'}`} />
                    </button>
                  ))}
                </div>
                <p className="h-5 text-sm font-bold text-[#30363A]" aria-live="polite">{ratingLabels[rating]}</p>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-bold">
                <span>Comentário <span className="font-normal text-[#626B70]">(opcional)</span></span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="O que podemos melhorar?"
                  className="resize-none rounded-xl border border-[#C4CBCD] px-4 py-3 text-base font-normal outline-none focus:border-[#C92743] focus:ring-2 focus:ring-[#C92743]/20"
                />
              </label>
            </>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-[#C92743]">{error}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E1E3E3] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {stage === 1 ? (
            <button type="button" onClick={goToRating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C92743] px-5 py-3.5 font-bold text-white transition hover:bg-[#A91F37]">
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <>
              <button type="button" onClick={() => sendToWhatsapp()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-5 py-3.5 font-bold text-black transition hover:bg-[#44df7c]">
                <MessageCircle className="size-4" /> Avaliar e ir ao WhatsApp
              </button>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => { setStage(1); setError('') }} className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-[#626B70] hover:text-[#30363A]">
                  <ArrowLeft className="size-4" /> Voltar
                </button>
                <button type="button" onClick={() => sendToWhatsapp(true)} className="py-2 text-sm font-semibold text-[#626B70] underline-offset-2 hover:text-[#30363A] hover:underline">
                  Pular avaliação
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
