import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MatchesProvider } from './contexts/MatchesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import ClientLayout from '../components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PickleWickel',
  description: 'Your pickleball companion app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
          <MatchesProvider>
            <ClientLayout>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ClientLayout>
          </MatchesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}