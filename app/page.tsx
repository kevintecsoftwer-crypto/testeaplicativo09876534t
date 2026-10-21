'use client'

import useSWR from 'swr'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Droplets,
  Gauge,
  MoreHorizontal,
  PlugZap,
  Search,
  MapPin,
  MessageCircle,
  Navigation,
  Star,
  Smartphone,
  Tablet,
  Watch,
  Volume2,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewsCarousel } from '@/components/reviews-carousel'

type DeviceType = 'Celular' | 'Tablet' | 'Apple Watch' | 'Outro aparelho'
type Step = 1 | 2 | 3 | 4 | 5 | 6

const whatsappNumber = '5515996303178'
const whatsappGreeting = 'Vim pelo site e preciso de um orçamento.'
const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappGreeting)}&type=phone_number&app_absent=0`
const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-05-04%20at%2015.56.35%281%29-eDnLzvO9vQR2l416jCo7UtPUqodDH2.jpeg'
const googleMapsUrl = 'https://www.google.com/maps/place/Centro+Cell/@-23.5002386,-47.4570268,17z/data=!3m1!4b1!4m6!3m5!1s0x94c58bc5b2d54e1d:0x93065e9d710a8caa!8m2!3d-23.5002386!4d-47.4544519!16s%2Fg%2F11r9b389gs?entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D'
const centroCellCoordinates = { latitude: -23.5002386, longitude: -47.4544519 }
const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centroCellCoordinates.latitude},${centroCellCoordinates.longitude}`
const wazeUrl = `https://waze.com/ul?ll=${centroCellCoordinates.latitude}%2C${centroCellCoordinates.longitude}&navigate=yes`

const deviceOptions: { name: DeviceType; description: string; icon: typeof Smartphone }[] = [
  { name: 'Celular', description: 'iPhone, Samsung, Motorola e mais', icon: Smartphone },
  { name: 'Tablet', description: 'iPad e tablets Android', icon: Tablet },
  { name: 'Apple Watch', description: 'Todas as gerações', icon: Watch },
  { name: 'Outro aparelho', description: 'Descreva seu equipamento', icon: Wrench },
]

const brandsByDevice: Record<DeviceType, string[]> = {
  Celular: ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Outra marca'],
  Tablet: ['Apple', 'Samsung', 'Lenovo', 'Outra marca'],
  'Apple Watch': ['Apple'],
  'Outro aparelho': ['Não sei informar', 'Outra marca'],
}

type CatalogEntry = { name: string; aliases: string[]; source: string; verifiedAt: string }

function modelFamily(name: string) {
  const value = compact(name)
  if (value.includes('iphone')) return 'iPhone'
  if (value.includes('ipad')) return 'iPad'
  if (value.includes('watch')) return 'Apple Watch'
  if (value.includes('galaxys')) return 'Galaxy S'
  if (value.includes('galaxynote')) return 'Galaxy Note'
  if (value.includes('galaxya')) return 'Galaxy A'
  if (value.includes('galaxyz')) return 'Galaxy Z'
  if (value.includes('galaxym')) return 'Galaxy M'
  if (value.includes('galaxytab')) return 'Galaxy Tab'
  if (value.includes('motoedge')) return 'Motorola Edge'
  if (value.includes('motog')) return 'Motorola Moto G'
  if (value.includes('motog')) return 'Motorola Moto G'
  if (value.includes('redmi')) return 'Xiaomi Redmi'
  if (value.includes('poco')) return 'Xiaomi POCO'
  return 'Outros modelos'
}
type TechApiIndex = { results?: Array<{ slug: string; name: string; url?: string }> }

const techApiIndexCache: { entries: CatalogEntry[] | null; promise: Promise<CatalogEntry[]> | null } = { entries: null, promise: null }
const techApiIndexUrl = 'https://gettechapi.github.io/TechAPI/v1/smartphones/index.json'

async function loadTechApiModels() {
  if (techApiIndexCache.entries) return techApiIndexCache.entries
  if (!techApiIndexCache.promise) {
    techApiIndexCache.promise = fetch(techApiIndexUrl, { signal: AbortSignal.timeout(7000) })
      .then((response) => { if (!response.ok) throw new Error('TechAPI indisponível'); return response.json() as Promise<TechApiIndex> })
      .then((data) => {
        const unique = new Map<string, CatalogEntry>()
        for (const item of data.results || []) {
          const key = compact(item.name)
          if (!key || unique.has(key)) continue
          unique.set(key, { name: item.name, aliases: [item.slug], source: 'TechAPI (dados complementares)', verifiedAt: '2026-10' })
        }
        techApiIndexCache.entries = [...unique.values()]
        return techApiIndexCache.entries
      })
      .catch((error) => { techApiIndexCache.promise = null; throw error })
  }
  return techApiIndexCache.promise
}

type Review = { id: string; author: string; rating: number; text: string; date?: string; source: 'Google' }
type ReviewsResponse = { reviews: Review[]; syncedAutomatically: boolean; source: string }
type AtendimentoCookie = { protocol: string; device: string; brand: string; model: string; deviceId: string; date: string; problems: string[]; rating?: number; feedback?: string; evaluatedAt?: string; ratingChangedAt?: string }

function createDeviceId() {
  return `AP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

const googleReviewUrl = 'https://g.page/r/CaqMCnGdXgaTEAE/review'
const atendimentoCookieName = 'centro-cell-atendimentos'

function readAtendimentosCookie() {
  const value = document.cookie.split('; ').find((entry) => entry.startsWith(`${atendimentoCookieName}=`))?.split('=').slice(1).join('=')
  if (!value) return [] as AtendimentoCookie[]
  try { return JSON.parse(decodeURIComponent(value)) as AtendimentoCookie[] } catch { return [] as AtendimentoCookie[] }
}

function writeAtendimentosCookie(items: AtendimentoCookie[]) {
  document.cookie = `${atendimentoCookieName}=${encodeURIComponent(JSON.stringify(items.slice(0, 10)))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`
}

function groupAtendimentosByDevice(items: AtendimentoCookie[]) {
  const groups = new Map<string, { device: string; brand: string; model: string; cases: AtendimentoCookie[] }>()
  for (const item of items) {
    const key = item.deviceId || `${item.device}|${item.brand}|${item.model}`
    const current = groups.get(key)
    if (current) current.cases.push(item)
    else groups.set(key, { device: item.device, brand: item.brand, model: item.model, cases: [item] })
  }
  return [...groups.values()]
}

const fetcher = (url: string) => fetch(url).then((response) => response.json() as Promise<ReviewsResponse>)

const modelsByBrand: Record<string, CatalogEntry[]> = {
  Apple: [
    ...['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone Air', 'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    { name: 'iPhone 16 Pro Max', aliases: ['iphone16promax', 'a3296'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 16', aliases: ['iphone16', 'a3281'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 15 Pro Max', aliases: ['iphone15promax', 'a3108'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 15 Pro', aliases: ['iphone15pro', 'a3102'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 15', aliases: ['iphone15', 'a3090'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 14', aliases: ['iphone14', 'a2882'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPhone 13', aliases: ['iphone13', 'a2633'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'iPad', aliases: ['ipad', 'ipad10', 'ipad air', 'ipad pro'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'Apple Watch', aliases: ['watch', 'applewatch', 'series 9', 'series 8'], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
    { name: 'Outro modelo Apple', aliases: [], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
  ],
  Samsung: [
    ...['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy S20 Ultra', 'Galaxy S20+', 'Galaxy S20 FE', 'Galaxy S20'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    ...['Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Galaxy Note 10+', 'Galaxy Note 10', 'Galaxy Note 9'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    ...['Galaxy A56', 'Galaxy A36', 'Galaxy A26', 'Galaxy A16', 'Galaxy A15', 'Galaxy A55', 'Galaxy A35', 'Galaxy A25', 'Galaxy A24', 'Galaxy A54', 'Galaxy A34', 'Galaxy A14', 'Galaxy A53', 'Galaxy A33'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    ...['Galaxy Z Fold6', 'Galaxy Z Flip6', 'Galaxy Z Fold5', 'Galaxy Z Flip5', 'Galaxy Z Fold4', 'Galaxy Z Flip4'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    ...['Galaxy M55', 'Galaxy M35', 'Galaxy M15'].map((name) => ({ name, aliases: [name.toLowerCase().replace(/[^a-z0-9]/g, '')], source: 'Catálogo Centro Cell — Brasil', verifiedAt: '2026-10' })),
    { name: 'Outro modelo Samsung', aliases: [], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' },
  ],
  Motorola: ['Motorola Edge 60 Pro', 'Motorola Edge 60 Fusion', 'Motorola Edge 50 Ultra', 'Motorola Edge 50 Pro', 'Moto G75', 'Moto G85', 'Moto G55', 'Moto G35', 'Moto G34', 'Moto G24', 'Moto G84', 'Outro modelo Motorola'].map((name) => ({ name, aliases: [name.replace(/moto /i, '').toLowerCase()], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' })),
  Xiaomi: ['Xiaomi 15', 'Xiaomi 14T', 'Xiaomi 14', 'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'POCO F6 Pro', 'POCO F6', 'POCO X6 Pro', 'POCO X6', 'Outro modelo Xiaomi'].map((name) => ({ name, aliases: [name.replace(/ /g, '').toLowerCase()], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' })),
  Lenovo: ['Tab M10', 'Tab P11', 'Tab M9', 'Outro modelo Lenovo'].map((name) => ({ name, aliases: [name.replace(/ /g, '').toLowerCase()], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' })),
  'Outra marca': [{ name: 'Não sei o modelo', aliases: [], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' }, { name: 'Outro modelo', aliases: [], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' }],
  'Não sei informar': [{ name: 'Não sei o modelo', aliases: [], source: 'Catálogo Centro Cell', verifiedAt: '2026-10' }],
}

const problemOptions: { name: string; description: string; icon: typeof Smartphone }[] = [
  { name: 'Tela e imagem', description: 'Quebras, manchas, linhas ou toque', icon: Smartphone },
  { name: 'Bateria e energia', description: 'Dura pouco, aquece ou não liga', icon: BatteryCharging },
  { name: 'Carregamento', description: 'Não carrega ou há mau contato', icon: PlugZap },
  { name: 'Câmeras', description: 'Imagem, foco ou lente danificada', icon: Camera },
  { name: 'Áudio', description: 'Microfone, alto-falante ou auricular', icon: Volume2 },
  { name: 'Software e desempenho', description: 'Lentidão, travamentos ou sistema', icon: Gauge },
  { name: 'Contato com líquido', description: 'Molhou, umidade ou oxidação', icon: Droplets },
  { name: 'Outros problemas', description: 'Conte o que aconteceu', icon: MoreHorizontal },
]

const problemDetails: Record<string, string> = {
  'Tela e imagem': 'Tela quebrada, trincada ou com defeito',
  'Bateria e energia': 'Bateria com pouca duração ou problema de funcionamento',
  Carregamento: 'Não carrega ou problema no conector de carga',
  Câmeras: 'Problema de câmera',
  Áudio: 'Problema de áudio, microfone ou alto-falante',
  'Software e desempenho': 'Problema de software ou sistema',
  'Contato com líquido': 'Contato com líquido ou umidade',
  'Outros problemas': 'Outro problema',
}

type DiagnosticQuestion = { prompt: string; options: string[] }

const questionsByProblem: Record<string, DiagnosticQuestion[]> = {
  'Tela e imagem': [
    { prompt: 'O que acontece com a imagem da tela?', options: ['A imagem aparece normalmente', 'A tela apresenta listras ou linhas', 'Aparecem manchas ou pontos escuros', 'A tela fica piscando', 'A tela fica preta, mas o aparelho continua funcionando', 'A tela não acende', 'A imagem aparece, mas está distorcida', 'Não sei identificar'] },
    { prompt: 'Como está funcionando o toque na tela?', options: ['Funciona normalmente em toda a tela', 'Algumas partes não respondem ao toque', 'O toque funciona sozinho, sem encostar', 'O toque não funciona', 'Não sei dizer'] },
  ],
  'Bateria e energia': [
    { prompt: 'O que você percebeu sobre a bateria?', options: ['Descarrega muito rápido', 'O aparelho aquece durante o uso', 'Desliga mesmo com carga', 'O aparelho não liga', 'Não sei identificar'] },
  ],
  Carregamento: [
    { prompt: 'O que acontece quando você conecta o carregador?', options: ['Não aparece sinal de carregamento', 'Carrega apenas em uma posição', 'A conexão fica frouxa', 'O carregamento interrompe sozinho', 'Não sei dizer'] },
  ],
  Câmeras: [
    { prompt: 'Como a câmera está se comportando?', options: ['Não mostra imagem', 'Não consegue focar', 'A lente está danificada', 'A imagem fica tremida ou desfocada', 'Funciona apenas às vezes', 'Não sei identificar'] },
  ],
  Áudio: [
    { prompt: 'Qual parte do áudio apresenta problema?', options: ['A outra pessoa não me ouve', 'Não ouço chamadas no auricular', 'O alto-falante não reproduz som', 'O som fica baixo ou falhando', 'Não sei identificar'] },
  ],
  'Software e desempenho': [
    { prompt: 'Como o aparelho está se comportando?', options: ['Está lento', 'Trava ou reinicia sozinho', 'Apresenta uma mensagem de erro', 'Algum aplicativo não abre', 'Não sei identificar'] },
  ],
  'Contato com líquido': [
    { prompt: 'O que aconteceu com o aparelho?', options: ['Molhou recentemente', 'Caiu na água', 'Teve contato com umidade', 'Notei sinais de oxidação', 'Não sei identificar'] },
  ],
  'Outros problemas': [
    { prompt: 'Como você descreveria o problema?', options: ['Acontece às vezes', 'O aparelho não funciona', 'Não sei identificar', 'Prefiro explicar nas observações'] },
  ],
}

function normalize(value: string) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function compact(value: string) {
  return normalize(value).replace(/[^a-z0-9]/g, '')
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let index = 1; index <= left.length; index += 1) {
    let diagonal = row[0]
    row[0] = index
    for (let cursor = 1; cursor <= right.length; cursor += 1) {
      const above = row[cursor]
      row[cursor] = left[index - 1] === right[cursor - 1]
        ? diagonal
        : Math.min(diagonal + 1, row[cursor] + 1, row[cursor - 1] + 1)
      diagonal = above
    }
  }
  return row[right.length]
}

function catalogScore(entry: CatalogEntry, query: string) {
  const search = compact(query)
  if (!search) return 0
  const terms = [entry.name, ...entry.aliases].map(compact).filter(Boolean)
  if (terms.some((term) => term === search)) return 100
  if (terms.some((term) => term.startsWith(search))) return 80
  if (terms.some((term) => term.includes(search))) return 65
  return 0
}

export default function Page() {
  const [step, setStep] = useState<Step>(1)
  const [device, setDevice] = useState<DeviceType | ''>('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [modelCategory, setModelCategory] = useState('')
  const [externalModels, setExternalModels] = useState<CatalogEntry[]>([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [manualModel, setManualModel] = useState({ manufacturer: '', name: '', code: '', details: '' })
  const [problems, setProblems] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeProblem, setActiveProblem] = useState<string | null>(null)
  const [problemQuestionIndex, setProblemQuestionIndex] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [previousService, setPreviousService] = useState('')
  const [contactSource, setContactSource] = useState('')
  const [otherContactSource, setOtherContactSource] = useState('')
  const [notes, setNotes] = useState('')
  const [anonymousId, setAnonymousId] = useState('')
  const [protocol, setProtocol] = useState('')
  const [protocolHistory, setProtocolHistory] = useState<string[]>([])
  const [atendimentos, setAtendimentos] = useState<AtendimentoCookie[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState('')
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({})
  const [editingRatings, setEditingRatings] = useState<Record<string, boolean>>({})
  const [ratingFeedbackDrafts, setRatingFeedbackDrafts] = useState<Record<string, string>>({})
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({})
  const [validationMessage, setValidationMessage] = useState('')
  const configuratorRef = useRef<HTMLElement>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)
  const defectContentRef = useRef<HTMLDivElement>(null)
  const { data: reviewsData, isLoading: reviewsLoading } = useSWR<ReviewsResponse>('/api/reviews', fetcher, { refreshInterval: 60 * 60 * 1000, revalidateOnFocus: false })
  const [reviewIndex, setReviewIndex] = useState(0)

  useEffect(() => {
    if (reviewsData?.reviews.length && reviewIndex >= reviewsData.reviews.length) setReviewIndex(0)
  }, [reviewIndex, reviewsData?.reviews.length])

  useEffect(() => {
    const storage = window.localStorage
    const existingId = storage.getItem('centro-cell-anonymous-id') || (window.crypto?.randomUUID?.() ?? `cc-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    storage.setItem('centro-cell-anonymous-id', existingId)
    setAnonymousId(existingId)

    const savedCookie = document.cookie.split('; ').find((entry) => entry.startsWith('centro-cell-contact='))
    if (savedCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(savedCookie.split('=').slice(1).join('='))) as { name?: string; phone?: string; previousService?: string; contactSource?: string; otherContactSource?: string }
        setName(parsed.name || '')
        setPhone(parsed.phone || '')
        setPreviousService(parsed.previousService || '')
        setContactSource(parsed.contactSource || '')
        setOtherContactSource(parsed.otherContactSource || '')
      } catch {
        document.cookie = 'centro-cell-contact=; Max-Age=0; Path=/; SameSite=Lax'
      }
    }
    setAtendimentos(readAtendimentosCookie())
    const history = storage.getItem('centro-cell-protocols')
    if (history) {
      try { setProtocolHistory(JSON.parse(history) as string[]) } catch { storage.removeItem('centro-cell-protocols') }
    }
  }, [])

  useEffect(() => {
    if (step <= 1) return
    const frame = window.requestAnimationFrame(() => {
      const target = step === 4 ? defectContentRef.current : stepContentRef.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [step, activeProblem, problemQuestionIndex])

  const brands = device ? brandsByDevice[device] : []
  const localModelOptions = useMemo<CatalogEntry[]>(() => {
    const allModels = modelsByBrand[brand] || []
    const source = allModels.filter((item) => {
      const searchable = compact(`${item.name} ${item.aliases.join(' ')}`)
      if (modelCategory && modelFamily(item.name) !== modelCategory) return false
      if (device === 'Tablet') return brand === 'Apple' ? searchable.includes('ipad') : brand === 'Samsung' ? searchable.includes('tab') : brand === 'Lenovo' ? searchable.includes('tab') : !searchable.includes('iphone') && !searchable.includes('watch')
      if (device === 'Apple Watch') return searchable.includes('watch')
      if (device === 'Celular') return !searchable.includes('ipad') && !searchable.includes('tab') && !searchable.includes('watch')
      return true
    })
    const fallback = source.length ? source : [
      { name: 'Não sei o modelo', aliases: [], source: 'Catálogo local', verifiedAt: '2026-10' },
      { name: 'Informar manualmente', aliases: [], source: 'Catálogo local', verifiedAt: '2026-10' },
    ]
    const filteredSource = fallback
    if (!modelSearch.trim()) return filteredSource
    return filteredSource
      .map((item, index) => ({ item, score: catalogScore(item, modelSearch), index }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map(({ item }) => item)
  }, [brand, device, modelCategory, modelSearch])
  const modelCategories = useMemo(() => [...new Set((modelsByBrand[brand] || []).map((item) => modelFamily(item.name)))] , [brand])
  const modelOptions = useMemo<CatalogEntry[]>(() => {
    const merged = [...localModelOptions, ...externalModels]
    const unique = new Map<string, CatalogEntry>()
    for (const item of merged) {
      const key = compact(item.name)
      if (key && !unique.has(key)) unique.set(key, item)
    }
    return [...unique.values()].slice(0, 12)
  }, [externalModels, localModelOptions])
  const externalSearchKey = `${brand}|${modelSearch.trim()}`

  useEffect(() => {
    if (!modelSearch.trim() || modelSearch.trim().length < 2 || localModelOptions.length > 0 || !brand || brand === 'Outra marca') {
      setExternalModels([])
      setExternalLoading(false)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setExternalLoading(true)
      try {
        const entries = await loadTechApiModels()
        const brandTerm = compact(brand)
        const query = compact(modelSearch)
        const matches = entries.filter((entry) => {
          const searchable = compact(`${entry.name} ${entry.aliases.join(' ')}`)
          const brandMatches = searchable.includes(brandTerm) || (brand === 'Apple' && searchable.includes('iphone')) || (brand === 'Samsung' && searchable.includes('galaxy'))
          return brandMatches && searchable.includes(query)
        }).slice(0, 8)
        if (!cancelled) setExternalModels(matches)
      } catch {
        if (!cancelled) setExternalModels([])
      } finally {
        if (!cancelled) setExternalLoading(false)
      }
    }, 350)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [brand, externalSearchKey, localModelOptions.length, modelSearch])

  const questions = useMemo(() => problems.flatMap((problem) => (questionsByProblem[problem] || []).map((question) => question.prompt)), [problems])
  const reviews = reviewsData?.reviews ?? []


  useEffect(() => {
    if (reviews.length < 2) return
    const timer = window.setInterval(() => setReviewIndex((current) => (current + 1) % reviews.length), 7000)
    return () => window.clearInterval(timer)
  }, [reviews.length])

  function chooseDevice(value: DeviceType) {
    setDevice(value)
    setBrand('')
    setModel('')
    setStep(2)
  }

  function continuePreviousDevice(item: AtendimentoCookie) {
    setDevice(item.device as DeviceType)
    setBrand(item.brand)
    setModel(item.model)
    setModelSearch(item.model)
    setActiveDeviceId(item.deviceId)
    setProblems([])
    setAnswers({})
    setActiveProblem(null)
    setProblemQuestionIndex(0)
    setStep(4)
  }

  function chooseBrand(value: string) {
    setBrand(value); setModelCategory(''); setModel(''); setModelSearch(''); setStep(3)
  }

  function chooseModel(value: string) {
    const normalizedModel = value === 'Não sei o modelo' ? 'Não sabe informar' : value
    setModel(normalizedModel)
    if (value === 'Informar manualmente') {
      setManualModel((current) => ({ ...current, manufacturer: current.manufacturer || brand, name: current.name || modelSearch.trim() }))
      return
    }
    window.setTimeout(() => setStep(4), 180)
  }

  function toggleProblem(value: string) {
    setProblems((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
    setActiveProblem(value)
    setProblemQuestionIndex(0)
  }

  function chooseProblemAnswer(problem: string, question: DiagnosticQuestion, value: string) {
    setAnswers((current) => ({ ...current, [question.prompt]: value }))
    const questionCount = (questionsByProblem[problem] || []).length
    if (problemQuestionIndex < questionCount - 1) setProblemQuestionIndex((current) => current + 1)
  }

  function answerQuestion(question: string, value: string, index: number) {
    setAnswers((current) => ({ ...current, [question]: value }))
    window.setTimeout(() => {
      const nextQuestion = document.querySelector<HTMLSelectElement>(`select[data-question-index="${index + 1}"]`)
      nextQuestion?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nextQuestion?.focus({ preventScroll: true })
    }, 120)
  }

  function canAdvance() {
    if (step === 1) return Boolean(device)
    if (step === 2) return Boolean(brand)
    if (step === 3) return Boolean(model)
    if (step === 4) return problems.length > 0
    return true
  }

  function next() {
    if (!canAdvance()) return
    setStep((current) => Math.min(6, current + 1) as Step)
  }

  function back() {
    setStep((current) => Math.max(1, current - 1) as Step)
  }

  function buildMessage(currentProtocol: string) {
    const answeredQuestions = questions.filter((question) => answers[question])
    const lines = ['Olá, equipe Centro Cell! Tudo bem? Gostaria de solicitar um atendimento técnico.']
    const selectedModel = model === 'Informar manualmente' ? manualModel.name : model
    const deviceLabel = [device, brand, selectedModel].filter(Boolean).join(' — ') || 'Não informado'
  const normalizedPreviousService = previousService.includes('Sim') ? 'Sim' : previousService.includes('Não') ? 'Não' : previousService
  const icons = {
  protocol: '📋', device: '📱', problem: '🔧', details: '📝', notes: '🗒️', client: '👤', phone: '📞', customer: '⭐', source: '📍', yes: '✅', no: '❌',
  }
  lines.push('', `${icons.protocol} Protocolo: ${currentProtocol}`, '', `${icons.device} Aparelho: *${deviceLabel}*`)
  if (problems.length) {
    lines.push('', `${icons.problem} Problema: ${problems.join(', ')}`)
    if (answeredQuestions.length) lines.push('', `${icons.details} Detalhes:`, ...answeredQuestions.map((question) => `- ${question}: ${answers[question]}`))
    if (notes.trim()) lines.push('', `${icons.notes} Observações: ${notes.trim()}`)
  }
  const currentDeviceId = activeDeviceId || atendimentos.find((item) => item.device === device && item.brand === brand && item.model === (model === 'Informar manualmente' ? manualModel.name : model))?.deviceId
  const previousCases = currentDeviceId ? atendimentos.filter((item) => item.deviceId === currentDeviceId) : []
  if (previousCases.length) {
    lines.push('', `${icons.details} Histórico deste aparelho:`)
    previousCases.slice(0, 3).forEach((item) => lines.push(`- Protocolo: ${item.protocol} | Atendimento: ${new Date(item.date).toLocaleDateString('pt-BR')} | ${item.problems.join(', ') || 'Atendimento realizado'}${item.rating ? ` | Avaliação: ${item.rating}/5` : ''}`))
  }
  if (name) lines.push('', `${icons.client} Cliente: *${name}*`)
  if (phone) lines.push(`${icons.phone} Telefone: ${phone}`)
  if (normalizedPreviousService) lines.push(`${icons.customer} Já é cliente: ${normalizedPreviousService === 'Sim' ? `${icons.yes} Sim` : normalizedPreviousService === 'Não' ? `${icons.no} Não` : normalizedPreviousService}`)
  if (contactSource) lines.push(`${icons.source} Origem do contato: *${contactSource === 'Outro' ? (otherContactSource || 'Outro') : contactSource}*`)
    lines.push('', 'Gostaria de receber orientações sobre a avaliação técnica e os próximos passos. Obrigado!')
    return lines.join('\n')
  }

  const message = useMemo(() => buildMessage(protocol || 'Será gerado ao confirmar'), [answers, brand, contactSource, device, manualModel, model, name, notes, otherContactSource, phone, previousService, problems, protocol, questions])

  function createProtocol() {
    const now = new Date()
    const year = String(now.getFullYear()).slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const selectedModel = model === 'Informar manualmente' ? manualModel.name : model
    const brandLetter = (brand.trim().match(/[A-Za-zÀ-ÿ]/)?.[0] || 'C').toUpperCase()
    const modelLetter = (selectedModel.trim().match(/[A-Za-zÀ-ÿ]/)?.[0] || 'M').toUpperCase()
    const randomCharacters = Array.from({ length: 5 }, () => {
      const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      return alphabet[Math.floor(Math.random() * alphabet.length)]
    }).join('')
    return `${year}-${month}-${brandLetter}-${modelLetter}-${randomCharacters}`
  }

  function changeRating(item: AtendimentoCookie) {
    const rating = ratingDrafts[item.protocol]
    if (!rating) return
    const changedAt = new Date().toISOString()
    const feedback = ratingFeedbackDrafts[item.protocol]?.trim() || ''
    const message = ['Olá, equipe Centro Cell! Gostaria de atualizar a avaliação do meu atendimento.', '', `📋 Protocolo: ${item.protocol}`, `📱 Aparelho: *${[item.device, item.brand, item.model].filter(Boolean).join(' — ')}*`, `⭐ Nova avaliação: ${rating}/5`, `📝 Nova avaliação: ${feedback || 'Sem comentário adicional'}`, `🗓️ Alterada em: ${new Date(changedAt).toLocaleDateString('pt-BR')}`    ].join('\n')
    const updated = atendimentos.map((entry) => entry.protocol === item.protocol ? { ...entry, rating, feedback, ratingChangedAt: changedAt } : entry)
    writeAtendimentosCookie(updated)
    setAtendimentos(updated)
    setEditingRatings((current) => ({ ...current, [item.protocol]: false }))
    window.open(`https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`, '_blank', 'noopener,noreferrer')
  }

  function sendFeedbackToWhatsapp(item: AtendimentoCookie) {
    const feedback = (feedbackDrafts[item.protocol] || item.feedback || '').trim()
    if (!feedback) return
    const message = [
      'Olá, equipe Centro Cell! Gostaria de deixar uma sugestão sobre meu atendimento.',
      '',
      `📋 Protocolo: ${item.protocol}`,
      `⭐ Nota: ${item.rating || 0}/5`,
      `📱 Aparelho: *${[item.device, item.brand, item.model].filter(Boolean).join(' — ')}*`,
      `📝 Sugestão: ${feedback}`,
      '',
      'Obrigado pela atenção. Esperamos contribuir para uma experiência ainda melhor.',
].join('\n')
    const updated = atendimentos.map((entry) => entry.protocol === item.protocol ? { ...entry, feedback, evaluatedAt: entry.evaluatedAt || new Date().toISOString() } : entry)
    writeAtendimentosCookie(updated)
    setAtendimentos(updated)
    setFeedbackSent((current) => ({ ...current, [item.protocol]: true }))
    window.open(`https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`, '_blank', 'noopener,noreferrer')
  }

  function sendToWhatsapp() {
  if (!name.trim() || !contactSource || (contactSource === 'Outro' && !otherContactSource.trim())) {
      setValidationMessage(!name.trim() ? 'Informe seu nome para continuar.' : contactSource === 'Outro' && !otherContactSource.trim() ? 'Descreva como conheceu a Centro Cell.' : 'Selecione como conheceu a Centro Cell.')
      return
    }
    setValidationMessage('')
    const currentProtocol = protocol || createProtocol()
  const outgoingMessage = buildMessage(currentProtocol)
  if (outgoingMessage.includes('\uFFFD')) {
      setValidationMessage('Não foi possível preparar a mensagem porque um caractere inválido foi detectado. Revise os campos e tente novamente.')
      return
    }
    const nextHistory = protocolHistory.includes(currentProtocol) ? protocolHistory : [currentProtocol, ...protocolHistory].slice(0, 20)
    window.localStorage.setItem('centro-cell-protocols', JSON.stringify(nextHistory))
    setProtocol(currentProtocol)
    setProtocolHistory(nextHistory)
  const contactCookie = encodeURIComponent(JSON.stringify({ name: name.trim(), phone: phone.trim(), previousService, contactSource, otherContactSource: otherContactSource.trim() }))
  document.cookie = `centro-cell-contact=${contactCookie}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`
    const deviceModel = model === 'Informar manualmente' ? manualModel.name : model
  const deviceId = activeDeviceId || createDeviceId()
  const atendimento: AtendimentoCookie = { protocol: currentProtocol, device, brand, model: deviceModel, deviceId, problems, date: new Date().toISOString() }
    const updatedAtendimentos = [atendimento, ...atendimentos.filter((item) => item.protocol !== currentProtocol)]
    writeAtendimentosCookie(updatedAtendimentos)
    setAtendimentos(updatedAtendimentos)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(outgoingMessage)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#D9DDDF] text-[#30363A]">
      <header className="sticky top-0 z-10 border-b border-[#C4CBCD] bg-[#FFFFFF]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:min-h-20 sm:px-5 lg:px-8">
          <a href="#configurador" aria-label="Centro Cell Sorocaba - atendimento" className="flex shrink-0 items-center gap-2.5"><img src={logoUrl} alt="Centro Cell Sorocaba" className="size-10 rounded-full object-cover sm:size-12" /><span className="hidden text-sm font-bold tracking-[0.18em] sm:inline">CENTRO <span className="text-[#ef1717]">CELL</span></span></a>
          <nav className="hidden items-center gap-5 text-sm text-[#626B70] lg:flex" aria-label="Navegação principal"><a href="#sobre" className="transition hover:text-slate-950">Quem somos</a><a href="#assistencia" className="transition hover:text-slate-950">Serviços</a><a href="#localizacao" className="transition hover:text-slate-950">Como chegar</a><a href="#avaliacoes" className="transition hover:text-slate-950">O que dizem</a></nav>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-[#C92743] px-3 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#A91F37] sm:px-4 sm:text-sm">Preciso de atendimento urgente</a>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 pb-3 text-xs text-[#626B70] lg:hidden" aria-label="Atalhos úteis"><a href="#assistencia" className="shrink-0 hover:text-slate-950">Serviços</a><a href="#localizacao" className="shrink-0 hover:text-slate-950">Como chegar</a><a href={whatsappUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[#ff4545] hover:text-slate-950">WhatsApp</a></nav>
      </header>

      {atendimentos.some((item) => !item.evaluatedAt) && <section id="historico" className="mx-auto max-w-6xl px-4 py-10 sm:px-5 lg:px-8"><div className="rounded-3xl border border-[#C4CBCD] bg-white p-5 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Histórico neste dispositivo</p><h2 className="mt-2 text-3xl font-black tracking-tight">Como foi sua experiência?</h2><p className="mt-2 text-sm text-[#626B70]">Os atendimentos ficam salvos somente neste navegador.</p><div className="mt-6 grid gap-4">{atendimentos.filter((item) => !item.evaluatedAt).map((item) => <article key={item.protocol} className="rounded-2xl border border-[#E1E3E3] bg-[#FAFAF8] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">{item.device} · {item.brand} · {item.model || 'Modelo não informado'}</p><p className="mt-1 text-xs text-[#626B70]">Protocolo {item.protocol} · Atendimento: {new Date(item.date).toLocaleDateString('pt-BR')}{item.evaluatedAt ? ` · Avaliado: ${new Date(item.evaluatedAt).toLocaleDateString('pt-BR')}` : ''}</p><p className="mt-2 text-sm text-[#626B70]">{item.problems.join(', ') || 'Sem problema informado'}</p></div>{item.rating ? <p className="text-sm font-bold text-[#C92743]">{item.rating}/5</p> : null}</div><div className="mt-4 flex flex-wrap items-center gap-1" aria-label={`Avaliação do atendimento ${item.protocol}`}>{[1,2,3,4,5].map((star) => <button key={star} type="button" aria-label={`${star} estrela${star > 1 ? 's' : ''}`} aria-pressed={item.rating === star} disabled={Boolean(item.rating) && !editingRatings[item.protocol]} onClick={() => item.rating ? setRatingDrafts((current) => ({ ...current, [item.protocol]: star })) : (() => { const updated = atendimentos.map((entry) => entry.protocol === item.protocol ? { ...entry, rating: star } : entry); writeAtendimentosCookie(updated); setAtendimentos(updated) })()} className={`text-2xl leading-none disabled:cursor-default ${(ratingDrafts[item.protocol] || item.rating) && star <= (ratingDrafts[item.protocol] || item.rating || 0) ? 'text-[#F59E0B]' : 'text-[#C4CBCD]'}`}>★</button>)}{item.rating && !editingRatings[item.protocol] && <button type="button" onClick={() => { setEditingRatings((current) => ({ ...current, [item.protocol]: true })); setRatingFeedbackDrafts((current) => ({ ...current, [item.protocol]: item.feedback || '' })) }} className="ml-3 rounded-lg border border-[#C92743] px-3 py-1 text-xs font-bold text-[#C92743]">Alterar avaliação</button>}</div>{editingRatings[item.protocol] && <div className="mt-3"><textarea value={ratingFeedbackDrafts[item.protocol] ?? ''} onChange={(event) => setRatingFeedbackDrafts((current) => ({ ...current, [item.protocol]: event.target.value }))} placeholder="Escreva sua nova avaliação" rows={3} className="w-full rounded-xl border border-[#DADCD8] bg-white px-3 py-2 text-sm outline-none focus:border-[#C92743]" /><p className="mt-2 text-xs text-[#626B70]">Escolha as novas estrelas, escreva sua avaliação e envie quando estiver pronto.</p><button type="button" disabled={!ratingDrafts[item.protocol]} onClick={() => changeRating(item)} className="mt-3 rounded-xl bg-[#C92743] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Enviar reavaliação</button></div>}{item.evaluatedAt ? <p className="mt-3 text-xs font-semibold text-[#626B70]">Avaliação enviada. Clique em uma estrela para registrar uma alteração e enviar a atualização pelo WhatsApp.</p> : item.rating === 5 ? <a href={googleReviewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-[#C92743] px-4 py-2 text-sm font-bold text-white">Avaliar no Google</a> : item.rating && item.rating <= 4 ? <div className="mt-3"><textarea value={feedbackDrafts[item.protocol] ?? item.feedback ?? ''} onChange={(event) => setFeedbackDrafts((current) => ({ ...current, [item.protocol]: event.target.value }))} placeholder="O que podemos melhorar?" rows={3} className="w-full rounded-xl border border-[#DADCD8] bg-white px-3 py-2 text-sm outline-none focus:border-[#C92743]" /><button type="button" onClick={() => sendFeedbackToWhatsapp(item)} className="mt-2 rounded-xl border border-[#C92743] px-4 py-2 text-sm font-bold text-[#C92743]">Enviar sugestão pelo WhatsApp</button>{feedbackSent[item.protocol] && <p className="mt-2 text-xs font-semibold text-[#2F7D4A]">Mensagem preparada no WhatsApp.</p>}</div> : null}</article>)}</div></div></section>}

      <section ref={configuratorRef} id="configurador" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-10 lg:px-8 lg:py-14">
        <div className="mb-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Atendimento guiado</p></div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#ed1717] transition-all" style={{ width: `${(step / 6) * 100}%` }} /></div>
        <div className="grid gap-8">
          <div ref={stepContentRef} className="scroll-mt-24 rounded-3xl border border-[#C4CBCD] bg-[#FFFFFF] p-5 sm:p-8">
            {step === 1 && <WizardStep title="Qual aparelho você precisa consertar?" subtitle="Escolha uma categoria para começar."><div className="grid gap-3 sm:grid-cols-2">{deviceOptions.map(({ name: item, description, icon: Icon }) => <button key={item} type="button" onClick={() => chooseDevice(item)} aria-pressed={device === item}
                        className={`group flex min-h-28 items-center gap-4 rounded-2xl border bg-[#FAFAF8] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9BDB8] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9233A] focus-visible:ring-offset-2 ${device === item ? 'border-2 border-[#C9233A] bg-[#F3E6E8]' : 'border-[#DADCD8]'}`}><Icon className="size-6 text-[#C92743]" /><span><strong className="block">{item}</strong><small className="mt-1 block text-sm font-medium leading-5 text-[#3F484D]">{description}</small></span></button>)}</div>{atendimentos.length > 0 && <div className="mt-5 border-t border-[#E1E3E3] pt-5"><p className="text-sm font-bold text-[#30363A]">Ou continue com um aparelho anterior</p><div className="mt-3 grid gap-2">{groupAtendimentosByDevice(atendimentos).slice(0, 3).map((group) => { const latest = group.cases[0]; const problemSummary = group.cases.flatMap((item) => item.problems.length ? item.problems.map((problem) => `${problem} — ${new Date(item.date).toLocaleDateString('pt-BR')}`) : [`Atendimento — ${new Date(item.date).toLocaleDateString('pt-BR')}`]); return <button key={`${group.device}-${group.brand}-${group.model}`} type="button" onClick={() => continuePreviousDevice(latest)} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DADCD8] bg-[#FAFAF8] p-3 text-left hover:border-[#C92743]"><span><strong className="block text-sm">{group.brand} {group.model || 'Modelo não informado'}</strong><small className="mt-1 block text-xs font-semibold text-[#C92743]">{latest.deviceId || 'AP-LEGACY'}</small><small className="mt-1 block text-xs text-[#626B70]">Atendimentos: {group.cases.length} · Último: {new Date(latest.date).toLocaleDateString('pt-BR')}</small><small className="mt-1 block text-xs text-[#626B70]">{problemSummary.join(' · ')}</small></span><span className="text-xs font-bold text-[#C92743]">Manutenção</span></button>})}</div></div>}</WizardStep>}
            {step === 2 && <WizardStep title="Qual é a marca?" subtitle={`Selecione a marca do seu ${device?.toLocaleLowerCase('pt-BR')}.`}><div className="grid gap-3 sm:grid-cols-2">{brands.map((item) => <ChoiceButton key={item} active={brand === item} onClick={() => chooseBrand(item)} showBrand>{item}</ChoiceButton>)}</div></WizardStep>}
{step === 3 && <WizardStep title="Qual é o modelo?" subtitle="Primeiro escolha a família; depois selecione a geração e a variação.">{modelCategories.length > 1 && <div className="mb-4"><p className="mb-2 text-sm font-bold text-[#30363A]">Escolha a série ou família</p><div className="flex flex-wrap gap-2">{modelCategories.map((category) => <button key={category} type="button" onClick={() => { setModelCategory(category); setModelSearch('') }} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${modelCategory === category ? 'border-[#C92743] bg-[#F3E6E8] text-[#C92743]' : 'border-[#DADCD8] bg-[#FAFAF8] text-[#626B70]'}`}>{category}</button>)}</div></div>}<input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="Ex.: iPhone 13, A55 ou SM-A556" aria-label="Pesquisar modelo" className="mb-2 h-12 w-full rounded-xl border border-[#DADCD8] bg-[#FAFAF8] px-4 text-sm text-slate-950 shadow-sm outline-none placeholder:text-[#5f6368] transition focus:border-[#C9233A] focus:ring-2 focus:ring-[#C9233A]/20" />{externalLoading && <p className="mb-3 text-xs text-[#626B70]" role="status">Buscando sugestões complementares���</p>}<div className="grid gap-2 sm:grid-cols-2">{modelOptions.map((item) => <ChoiceButton key={`${item.source}-${item.name}`} active={model === item.name} onClick={() => chooseModel(item.name)}>{item.name}</ChoiceButton>)}</div>{modelSearch.trim() && modelOptions.length === 0 && <div className="rounded-2xl border border-[#C4CBCD] bg-[#F5F6F5] p-4 text-sm text-[#626B70]">Não encontramos uma correspondência segura no catálogo local. Você pode informar o modelo manualmente ou seguir sem saber o modelo.</div>}<div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><button type="button" onClick={() => setModel('N��o sei o modelo')} className="text-[#C92743] underline underline-offset-4">Não sei o modelo</button><button type="button" onClick={() => { setManualModel((current) => ({ ...current, manufacturer: brand, name: current.name || modelSearch.trim() })); setModel('Informar manualmente') }} className="text-[#C92743] underline underline-offset-4">Informar modelo manualmente</button></div><p className="mt-3 text-xs text-[#626B70]">Não encontrou seu aparelho? Você pode informar o modelo manualmente.</p>{model === 'Informar manualmente' && <div className="mt-4 grid gap-3 rounded-2xl border border-[#C4CBCD] bg-[#F5F6F5] p-4 sm:grid-cols-2"><input value={manualModel.manufacturer} onChange={(event) => setManualModel({ ...manualModel, manufacturer: event.target.value })} placeholder="Fabricante" className="h-11 rounded-xl border border-[#C4CBCD] bg-white px-3 text-sm" /><input value={manualModel.name} onChange={(event) => setManualModel({ ...manualModel, name: event.target.value })} placeholder="Nome do modelo" className="h-11 rounded-xl border border-[#C4CBCD] bg-white px-3 text-sm" /><input value={manualModel.code} onChange={(event) => setManualModel({ ...manualModel, code: event.target.value })} placeholder="Código (opcional)" className="h-11 rounded-xl border border-[#C4CBCD] bg-white px-3 text-sm" /><input value={manualModel.details} onChange={(event) => setManualModel({ ...manualModel, details: event.target.value })} placeholder="Detalhes (opcional)" className="h-11 rounded-xl border border-[#C4CBCD] bg-white px-3 text-sm" /></div>}</WizardStep>}
            {false && <WizardStep title="O que aconteceu com seu aparelho?" subtitle="Selecione um ou mais problemas. As perguntas aparecem na mesma tela, apenas quando fizerem sentido para sua escolha."><div className="flex flex-col gap-3">{problemOptions.map(({ name: item, description, icon: Icon }) => { const selected = problems.includes(item); const detailQuestions = questionsByProblem[item] || []; return <div key={item} className={`overflow-hidden rounded-2xl border transition ${selected ? 'border-2 border-[#C92743] bg-[#F3E6E8]' : 'border-[#C4CBCD] bg-[#F5F6F5]'}`}><button type="button" onClick={() => toggleProblem(item)} aria-expanded={selected} aria-pressed={selected} className="flex min-h-24 w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C92743]"><Icon className="size-6 shrink-0 text-[#C92743]" /><span className="min-w-0 flex-1"><strong className="block text-sm">{item}</strong><small className="mt-1 block leading-5 text-[#626B70]">{description}</small></span>{selected ? <Check className="size-5 shrink-0 text-[#C92743]" aria-label="Selecionado" /> : <ArrowRight className="size-4 shrink-0 text-[#626B70]" aria-hidden="true" />}</button>{selected && <div className="flex flex-col gap-4 border-t border-[#C92743]/20 px-4 pb-5 pt-4 sm:px-5">{detailQuestions.map((question) => <fieldset key={`${item}-${question.prompt}`} className="flex flex-col gap-2"><legend className="text-sm font-semibold text-[#30363A]">{question.prompt}</legend><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option) => <button key={option} type="button" aria-pressed={answers[question.prompt] === option} onClick={() => setAnswers((current) => ({ ...current, [question.prompt]: option }))} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92743] ${answers[question.prompt] === option ? 'border-[#C92743] bg-white font-semibold text-[#30363A] ring-1 ring-[#C92743]/30' : 'border-[#C4CBCD] bg-white/70 text-[#626B70] hover:border-[#C92743]/60'}`}>{option}</button>)}</div></fieldset>)}{item === 'Outros problemas' && <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Descreva o problema com suas palavras" aria-label="Descrição de outros problemas" className="w-full resize-none rounded-xl border border-[#C4CBCD] bg-white px-4 py-3 text-sm text-[#30363A] outline-none focus:border-[#C92743]" />}</div>}</div>})}</div><p className="mt-4 text-xs text-[#626B70]">Não sabe identificar? Tudo bem. Escolha “Não sei identificar” ou continue com as informações que souber.</p></WizardStep>}
            {step === 4 && <div ref={defectContentRef} className="scroll-mt-24 rounded-3xl border border-[#D7D9DD] bg-white p-4 shadow-sm sm:p-6" aria-labelledby="problem-dialog-title">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C92743]">Último diagnóstico</p><h3 id="problem-dialog-title" className="mt-2 text-2xl font-black tracking-tight">O que aconteceu?</h3><p className="mt-2 text-sm text-[#626B70]">Descreva com suas palavras — depois refinamos apenas o necessário.</p></div><button type="button" aria-label="Voltar ao modelo" onClick={() => setStep(3)} className="rounded-full p-2 text-[#626B70] hover:bg-[#F3E6E8] hover:text-[#C92743]"><X className="size-5" /></button></div>
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#D7D9DD] bg-white px-4 py-3"><Search className="size-5 shrink-0 text-[#626B70]" /><input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} aria-label="Modelo e o que aconteceu" placeholder={'Modelo e o que aconteceu — "Substituição da tela"'} className="min-w-0 flex-1 bg-transparent text-sm text-[#30363A] outline-none placeholder:text-[#7B8085]" /></div><div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl border border-[#D7D9DD] bg-[#F7F7F8] px-3 py-2 text-sm font-semibold"><Smartphone className="size-4 text-[#C92743]" />{brand || 'Marca'} · {model === 'Informar manualmente' ? manualModel.name : model || 'Modelo'}<span className="text-xs text-[#C92743]">Alterar</span></button>{problems.map((problem) => <span key={problem} className="inline-flex items-center gap-2 rounded-xl border border-[#C92743]/25 bg-[#F3E6E8] px-3 py-2 text-sm font-semibold"><Check className="size-4 text-[#C92743]" />{problem}</span>)}</div>
                {!activeProblem ? <div className="grid gap-3 sm:grid-cols-2">{problemOptions.map(({ name: item, description, icon: Icon }) => <button key={item} type="button" onClick={() => toggleProblem(item)} className="flex min-h-24 items-center gap-3 rounded-2xl border border-[#DADCD8] bg-[#FAFAF8] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C92743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92743]"><Icon className="size-6 shrink-0 text-[#C92743]" /><span><strong className="block text-sm">{item}</strong><small className="mt-1 block text-[#626B70]">{description}</small></span><ArrowRight className="ml-auto size-4 text-[#626B70]" /></button>)}</div> : <div><button type="button" onClick={() => { setActiveProblem(null); setProblemQuestionIndex(0) }} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#C92743]"><ArrowLeft className="size-4" /> Todos os defeitos</button><div className="rounded-2xl border-2 border-[#C92743] bg-[#F3E6E8] p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C92743]">Selecionado</p><h4 className="mt-1 text-lg font-bold">{activeProblem}</h4></div>{(() => { const question = (questionsByProblem[activeProblem] || [])[problemQuestionIndex]; if (!question) return <p className="mt-5 text-sm text-[#626B70]">Defeito registrado. Você pode adicionar outro problema.</p>; return <fieldset className="mt-5"><legend className="mb-3 text-base font-bold">{question.prompt}</legend><div className="grid gap-2">{question.options.map((option) => <button key={option} type="button" aria-pressed={answers[question.prompt] === option} onClick={() => chooseProblemAnswer(activeProblem, question, option)} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92743] ${answers[question.prompt] === option ? 'border-2 border-[#C92743] bg-[#F3E6E8] font-semibold' : 'border-[#DADCD8] bg-white hover:border-[#C92743]'}`}>{option}</button>)}</div><p className="mt-3 text-xs text-[#626B70]">Pergunta {problemQuestionIndex + 1} de {(questionsByProblem[activeProblem] || []).length}</p></fieldset>})()}<div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => { setActiveProblem(null); setProblemQuestionIndex(0) }} className="rounded-xl border border-[#C4CBCD] px-4 py-3 text-sm font-semibold">Adicionar outro defeito</button><button type="button" disabled={!problems.length} onClick={() => setStep(5)} className="rounded-xl bg-[#C92743] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Continuar</button></div></div>}
                {problems.length > 0 && !activeProblem && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E6E4] pt-4"><p className="text-sm text-[#626B70]">{problems.length} defeito(s) selecionado(s)</p><button type="button" onClick={() => setStep(5)} className="rounded-xl bg-[#C92743] px-4 py-3 text-sm font-bold text-white">Continuar</button></div>}
              </div>}
            {step === 5 && <WizardStep title="Conte um pouco mais" subtitle="As respostas do diagnóstico já foram salvas. Adicione apenas alguma observação importante."><div className="flex flex-col gap-6"><div className="hidden">{problems.map((problem) => <section key={problem} className="rounded-2xl border border-[#C4CBCD] bg-[#F5F6F5] p-4"><h4 className="font-bold text-[#C92743]">{problem}</h4><div className="mt-4 flex flex-col gap-5">{(questionsByProblem[problem] || []).map((question) => <fieldset key={question.prompt} className="flex flex-col gap-2"><legend className="text-sm font-semibold">{question.prompt}</legend><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option) => <button key={option} type="button" aria-pressed={answers[question.prompt] === option} onClick={() => setAnswers((current) => ({ ...current, [question.prompt]: option }))} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92743] focus-visible:ring-offset-2 active:scale-[.99] ${answers[question.prompt] === option ? 'border-2 border-[#C92743] bg-[#F3E6E8] font-semibold text-[#30363A] shadow-sm' : 'border-[#C4CBCD] bg-white text-[#626B70] hover:border-[#C92743]/60 hover:bg-[#FFFDFD]'}`}>{option}</button>)}</div></fieldset>)}</div></section>)}</div><label className="flex flex-col gap-2 text-sm font-semibold">Observações adicionais<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Algo importante que devemos saber?" className="resize-none rounded-xl border border-[#DADCD8] bg-[#FAFAF8] px-4 py-3 font-normal text-slate-950 shadow-sm outline-none placeholder:text-[#5f6368] transition focus:border-[#C9233A] focus:ring-2 focus:ring-[#C9233A]/20" /></label></div></WizardStep>}
            {step === 6 && <WizardStep title="Revise seu atendimento" subtitle="Confira as informações e veja se descreveu corretamente o problema antes de continuar para o WhatsApp."><div className="flex flex-col gap-4 rounded-2xl bg-[#FFFFFF] p-4 text-sm sm:p-5"><Summary label="Aparelho" value={[device, brand, model === 'Informar manualmente' ? manualModel.name : model].filter(Boolean).join(' · ') || 'Não informado'} onEdit={() => setStep(1)} /><Summary label="Problemas relatados" value={problems.join(', ') || 'Nenhum problema selecionado'} onEdit={() => setStep(4)} />{problems.map((problem) => { const answered = (questionsByProblem[problem] || []).filter((question) => answers[question.prompt]); return answered.length ? <div key={problem} className="rounded-xl border border-[#C4CBCD] bg-[#F5F6F5] p-3"><p className="font-bold text-[#C92743]">{problem}</p>{answered.map((question) => <p key={question.prompt} className="mt-2 text-[#626B70]"><span className="font-semibold text-[#30363A]">{question.prompt}:</span> {answers[question.prompt]}</p>)}</div> : null })}<Summary label="Seus dados" value={[name, phone, previousService ? `Já fez serviço na Centro Cell: ${previousService}` : ''].filter(Boolean).join(' · ') || 'Não informado'} onEdit={() => setStep(6)} />{notes && <Summary label="Observações adicionais" value={notes} onEdit={() => setStep(5)} />}</div>{validationMessage && <p role="alert" className="mt-4 rounded-xl border border-[#C92743]/30 bg-[#F3E6E8] px-3 py-2 text-sm text-[#C92743]">{validationMessage}</p>}<div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome *" required aria-required="true" className="h-12 rounded-xl border border-[#C4CBCD] bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-[#697583]/35 focus:border-[#ed1717]" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone (opcional)" inputMode="tel" className="h-12 rounded-xl border border-[#C4CBCD] bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-[#697583]/35 focus:border-[#ed1717]" /><select value={previousService} onChange={(event) => setPreviousService(event.target.value)} aria-label="Você já fez serviço com a Centro Cell?" className="h-12 rounded-xl border border-[#C4CBCD] bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#ed1717]"><option value="" className="bg-[#E9ECED]">Já fez serviço com a Centro Cell?</option><option className="bg-[#E9ECED]">✅ Sim</option><option className="bg-[#E9ECED]">❌ Não</option><option className="bg-[#E9ECED]">🤔 Não lembro</option></select><select value={contactSource} onChange={(event) => setContactSource(event.target.value)} aria-label="Como conheceu a Centro Cell?" className="h-12 rounded-xl border border-[#C4CBCD] bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#ed1717]"><option value="">Como conheceu a Centro Cell? *</option><option>Google / Pesquisa na internet</option><option>Instagram</option><option>Facebook</option><option>Indicação de amigos ou familiares</option><option>Já conhecia a Centro Cell</option><option>Passei em frente à loja</option><option>Outro</option></select>{contactSource === 'Outro' && <input value={otherContactSource} onChange={(event) => setOtherContactSource(event.target.value)} placeholder="Conte como conheceu (opcional)" className="h-12 rounded-xl border border-[#C4CBCD] bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-[#697583]/50 focus:border-[#ed1717]" />}</div><Button type="button" onClick={sendToWhatsapp} className="mt-5 h-12 w-full rounded-xl bg-[#25d366] font-bold text-black hover:bg-[#44df7c]"><MessageCircle data-icon="inline-start" /> Continuar para o WhatsApp</Button><p className="mt-3 text-center text-xs text-[#697583]/40">O WhatsApp abrirá com a mensagem pronta. Você ainda precisará confirmar o envio.</p></WizardStep>}
            {step < 6 && (step >= 4 || (step === 3 && model === 'Informar manualmente')) && <div className="mt-8 flex justify-between gap-3">{step > 1 ? <Button type="button" variant="outline" onClick={back} className="border-white/15 bg-transparent text-slate-950 hover:bg-slate-200"><ArrowLeft data-icon="inline-start" /> Voltar</Button> : <span />}{step < 5 ? <Button type="button" onClick={next} disabled={!canAdvance()} className="bg-[#ed1717] font-bold text-slate-950 hover:bg-[#ff2e2e] disabled:bg-slate-200">Continuar <ArrowRight data-icon="inline-end" /></Button> : <Button type="button" onClick={next} className="bg-[#ed1717] font-bold text-slate-950 hover:bg-[#ff2e2e]">Ver resumo <ArrowRight data-icon="inline-end" /></Button>}</div>}
            {step === 6 && <button type="button" onClick={back} className="mt-5 flex items-center gap-2 text-sm text-[#697583]/50 hover:text-slate-950"><ArrowLeft className="size-4" /> Voltar e editar</button>}
          </div>
        </div>
      </section>

      {atendimentos.some((item) => item.evaluatedAt) && <section id="historico-avaliado" className="mx-auto max-w-6xl px-4 py-10 sm:px-5 lg:px-8"><div className="rounded-3xl border border-[#C4CBCD] bg-white p-5 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Histórico de avaliações</p><h2 className="mt-2 text-3xl font-black tracking-tight">Atendimentos avaliados</h2><p className="mt-2 text-sm text-[#626B70]">Avaliações finalizadas ficam registradas neste navegador.</p><div className="mt-6 grid gap-4">{atendimentos.filter((item) => item.evaluatedAt).map((item) => <article key={`avaliado-${item.protocol}`} className="rounded-2xl border border-[#E1E3E3] bg-[#FAFAF8] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">{item.device} · {item.brand} · {item.model || 'Modelo não informado'}</p><p className="mt-1 text-xs text-[#626B70]">Protocolo: {item.protocol}</p><p className="mt-1 text-xs text-[#626B70]">Atendimento: {new Date(item.date).toLocaleDateString('pt-BR')} · Avaliação: {new Date(item.evaluatedAt as string).toLocaleDateString('pt-BR')}{item.ratingChangedAt ? ` · Alteração: ${new Date(item.ratingChangedAt).toLocaleDateString('pt-BR')}` : ''}</p><p className="mt-2 text-sm text-[#626B70]">{item.problems.join(', ') || 'Atendimento realizado'}</p></div><p className="text-sm font-bold text-[#C92743]">{item.rating}/5</p></div><div className="mt-3 flex gap-1 text-xl text-[#F59E0B]" aria-label={`Avaliação final ${item.rating} de 5 estrelas`}>{[1,2,3,4,5].map((star) => <span key={star}>{star <= (item.rating || 0) ? '★' : '☆'}</span>)}</div>{item.feedback && <p className="mt-3 rounded-xl border border-[#E1E3E3] bg-white p-3 text-sm text-[#626B70]">{item.feedback}</p>}{editingRatings[item.protocol] ? <div className="mt-4 rounded-2xl border border-[#E1E3E3] bg-white p-4"><p className="text-sm font-bold text-[#30363A]">Escolha sua nova nota</p><div className="mt-3 flex gap-1" aria-label={`Nova avaliação do atendimento ${item.protocol}`}>{[1,2,3,4,5].map((star) => <button key={star} type="button" onClick={() => setRatingDrafts((current) => ({ ...current, [item.protocol]: star }))} className={`text-2xl leading-none ${(ratingDrafts[item.protocol] || 0) >= star ? 'text-[#F59E0B]' : 'text-[#C4CBCD]'}`}>★</button>)}</div><textarea value={ratingFeedbackDrafts[item.protocol] ?? item.feedback ?? ''} onChange={(event) => setRatingFeedbackDrafts((current) => ({ ...current, [item.protocol]: event.target.value }))} placeholder="Escreva sua nova avaliação" rows={3} className="mt-3 w-full rounded-xl border border-[#DADCD8] bg-white px-3 py-2 text-sm outline-none focus:border-[#C92743]" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!ratingDrafts[item.protocol]} onClick={() => changeRating(item)} className="rounded-xl bg-[#C92743] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Enviar reavaliação</button><button type="button" onClick={() => setEditingRatings((current) => ({ ...current, [item.protocol]: false }))} className="rounded-xl border border-[#C4CBCD] px-4 py-2 text-sm font-bold text-[#626B70]">Cancelar</button></div></div> : <><p className="mt-3 text-xs font-semibold text-[#626B70]">Avaliação registrada e encerrada.</p><button type="button" onClick={() => { setEditingRatings((current) => ({ ...current, [item.protocol]: true })); setRatingDrafts((current) => ({ ...current, [item.protocol]: item.rating || 0 })); setRatingFeedbackDrafts((current) => ({ ...current, [item.protocol]: item.feedback || '' })) }} className="mt-3 rounded-xl border border-[#C92743] px-4 py-2 text-sm font-bold text-[#C92743]">Alterar avaliação</button></>}</article>)}</div></div></section>}

      <section id="assistencia" className="border-y border-[#C4CBCD] bg-[#f1f3f5]"><div className="mx-auto max-w-6xl px-5 py-12 lg:px-8"><div className="mb-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left"><img src={logoUrl} alt="Logomarca Centro Cell Sorocaba" className="h-20 w-20 rounded-2xl object-cover shadow-sm" /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Centro Cell Sorocaba</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#1F2528]">Tecnologia com cuidado de verdade.</h2><p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#465157]">Assistência técnica especializada no Centro de Sorocaba, com avaliação transparente, cuidado em cada reparo e eletrônicos e acessórios para facilitar o seu dia a dia.</p></div></div><div className="grid gap-8 md:grid-cols-3"><InfoCard icon={<Wrench />} title="Assistência técnica" text="Manutenção de celulares, tablets e Apple Watch com avaliação do caso antes da aprovação do serviço." /><InfoCard icon={<Smartphone />} title="Eletrônicos e acessórios" text="Também trabalhamos com venda de eletrônicos e acessórios. Consulte a disponibilidade com nossa equipe." /><InfoCard icon={<CircleHelp />} title="Atendimento transparente" text="Envie as informações iniciais pelo WhatsApp e converse diretamente com a Centro Cell." /></div></div></section>
      <section id="sobre" className="border-y border-[#C4CBCD] bg-[#f1f3f5]"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:px-8"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Quem somos</p><h2 className="text-3xl font-black leading-tight tracking-[-0.05em] sm:text-4xl">Tecnologia com cuidado de verdade.</h2><p className="mt-5 max-w-xl leading-7 text-[#626B70]">Na Centro Cell Sorocaba, o atendimento é personalizado: entendemos a necessidade de cada cliente e buscamos a melhor solução para o aparelho. Trabalhamos com foco em qualidade de peças, serviço e experiência, além de eletrônicos e acessórios selecionados para atender o que você precisa.</p></div><ReviewsCarousel reviews={reviews} loading={reviewsLoading} source={reviewsData?.source} syncedAutomatically={reviewsData?.syncedAutomatically ?? false} onOpenMaps={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')} /></div></section>

      <section id="localizacao" className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Como chegar</p><h2 className="text-4xl font-black tracking-[-0.05em]">Estamos no Centro de Sorocaba</h2><p className="mt-3 text-[#626B70]">Localização oficial da Centro Cell em Sorocaba. Use o ponto exato do perfil no Google Maps para traçar sua rota.</p></div><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="overflow-hidden rounded-3xl border border-[#C4CBCD] bg-[#E9ECED]"><iframe title="Mapa da Centro Cell Sorocaba" src="https://www.openstreetmap.org/export/embed.html?bbox=-47.461%2C-23.503%2C-47.448%2C-23.492&layer=mapnik&marker=-23.5002386%2C-47.4544519" className="h-72 w-full grayscale-[.35] sm:h-80" loading="lazy" /></div><div className="flex flex-col justify-center gap-3"><a href={googleDirectionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#DADCE0] bg-white px-5 py-3 font-bold text-[#202124] shadow-sm transition hover:bg-[#F8F9FA]"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/google-maps/default.svg" alt="" className="size-6 object-contain" /> Seguir pelo Google Maps</a><a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#343A40] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#23272B]"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/waze/default.svg" alt="" className="size-6 object-contain" /> Seguir pelo Waze</a><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="text-center text-sm text-[#697583] underline underline-offset-4 hover:text-slate-950">Ver perfil oficial e avaliações</a></div></div></section>

      <section id="contato" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C92743]">Fale com a gente</p><h2 className="text-4xl font-black tracking-[-0.05em]">Vamos cuidar do seu aparelho?</h2><p className="mt-4 flex items-start gap-3 text-[#626B70]"><MapPin className="mt-1 size-5 shrink-0 text-[#C92743]" />Localização oficial no perfil da Centro Cell no Google Maps.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-5 py-3 font-bold text-black hover:bg-[#44df7c]"><MessageCircle className="size-4" /> Falar pelo WhatsApp</a><a href="#localizacao" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-bold hover:bg-slate-200"><MapPin className="size-4" /> Como chegar</a></div></section>
      <footer className="border-t border-[#C4CBCD] px-5 py-10"><div className="mx-auto flex max-w-6xl flex-col gap-8 text-sm text-[#697583]/50 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-950">Centro Cell <span className="text-[#ef1717]">Sorocaba</span></p><p className="mt-2 max-w-xs leading-6">Assistência técnica, eletrônicos e acessórios.</p></div><nav aria-label="Links úteis" className="flex flex-wrap gap-x-10 gap-y-3"><a href="#assistencia" className="hover:text-slate-950">Serviços</a><a href="#localizacao" className="hover:text-slate-950">Como chegar</a><a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#25D366] px-4 py-2 font-bold text-[#073B1A] transition hover:bg-[#20BD5A]">WhatsApp</a></nav></div></footer>
    </main>
  )
}

function WizardStep({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div><h3 className="text-2xl font-black tracking-[-0.04em] text-[#1F2528]">{title}</h3><p className="mt-2 mb-5 text-sm font-medium leading-6 text-[#465157]">{subtitle}</p>{children}</div>
}

const brandLogos: Record<string, string> = {
  Apple: 'https://cdn.simpleicons.org/apple/30363A',
  Samsung: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/samsung/default.svg',
  Motorola: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/motorola/default.svg',
  Xiaomi: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/xiaomi/default.svg',
  Lenovo: 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/lenovo/default.svg',
}

function BrandMark({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const logo = brandLogos[name]
  if (!logo || failed) return <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#C4CBCD] bg-[#F5F6F5] text-sm font-black text-[#C92743]">{name.slice(0, 1)}</span>
  return <img src={logo} alt="" onError={() => setFailed(true)} className="size-8 object-contain" />
}

function ChoiceButton({ active, onClick, children, showBrand = false }: { active: boolean; onClick: () => void; children: React.ReactNode; showBrand?: boolean }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[14px] border bg-white px-4 py-3 text-left text-sm font-semibold shadow-[0_1px_3px_rgba(15,23,42,.06)] transition-colors hover:border-[#C92743]/45 hover:bg-[#FFFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9233A] focus-visible:ring-offset-2 ${active ? 'border-[#C9233A] bg-[#FFF4F5] text-slate-950 ring-1 ring-[#C9233A]/20' : 'border-[#DADCD8]'}`}><span className="flex min-w-0 items-center gap-3">{showBrand && typeof children === 'string' && <BrandMark name={children} />}<span>{children}</span></span>{active ? <Check className="size-4 shrink-0 text-[#C9233A]" aria-hidden="true" /> : <ArrowRight className="size-4 shrink-0 text-[#5f6368]" aria-hidden="true" />}</button>
}

function Summary({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <div className="flex min-w-0 items-start justify-between gap-2 border-b border-[#C4CBCD] pb-3 last:border-0 last:pb-0 sm:gap-4 sm:pb-4"><div className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-[#C92743] sm:text-xs">{label}</span><span className="mt-1 block break-words leading-5 text-[#697583]/75">{value}</span></div><button type="button" onClick={onEdit} aria-label={`Editar ${label}`} className="shrink-0 p-1 text-[#697583]/40 hover:text-slate-950"><X className="size-4" /></button></div>
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article><div className="mb-4 text-[#C92743]">{icon}</div><h3 className="font-bold text-[#1F2528]">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-[#465157]">{text}</p></article>
}
