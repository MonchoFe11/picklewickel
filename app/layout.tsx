import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MatchesProvider } from './contexts/MatchesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import ClientLayout from '../components/ClientLayout'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { TournamentsProvider } from './contexts/TournamentsContext';

const inter = Inter({ subsets: ['latin'] })

export function generateMetadata(): Metadata {
  return {
    title: 'PickleWickel',
    description: 'Your pickleball companion app',
    openGraph: {
      title: 'PickleWickel',
      description: 'Your professional pickleball companion app',
      images: ['/logo.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PickleWickel',
      description: 'Your professional pickleball companion app',
      images: ['/logo.png'],
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' && (
            <script
              defer
              data-domain="picklewickelmvp.vercel.app"
              src="https://plausible.io/js/plausible.js"
            />
          )}
        </head>
        <body className={inter.className}>
          <ThemeProvider>
          <TournamentsProvider>
            <MatchesProvider>
              <ClientLayout>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ClientLayout>
            </MatchesProvider>
            </TournamentsProvider>
          </ThemeProvider>
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}