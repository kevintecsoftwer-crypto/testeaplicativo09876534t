import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Centro Cell | Conserto de Celular em Sorocaba - Troca de Tela e Bateria',
  description: 'Assistência técnica especializada em celulares no Centro de Sorocaba. Reparo rápido de iPhone e Android, troca de tela e bateria na Rua Quinze de Novembro.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="geo.region" content="BR-SP" />
        <meta name="geo.placename" content="Sorocaba" />
        <meta name="geo.position" content="-23.5015;-47.4522" />
        <meta name="ICBM" content="-23.5015, -47.4522" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Centro Cell',
              telephone: '+5515996303178',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Rua Quinze de Novembro, 257',
                addressLocality: 'Sorocaba',
                addressRegion: 'SP',
                postalCode: '18010-008',
                addressCountry: 'BR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -23.5015,
                longitude: -47.4522,
              },
              openingHoursSpecification: [{
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '08:00',
                closes: '18:30',
              }],
              priceRange: '$$',
              areaServed: {
                '@type': 'City',
                name: 'Sorocaba',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
