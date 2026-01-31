import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'FamilyFlow',
  description: 'Gestion de tâches familiales fun et TDAH-friendly',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
