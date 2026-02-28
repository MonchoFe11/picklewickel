import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignedIn, UserButton } from '@clerk/nextjs'
import { ScrapeTargetsProvider } from '../contexts/ScrapeTargetsContext'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      {/* Admin Header with Logout */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-muted-green">Admin Panel - Authenticated</h1>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
      <ScrapeTargetsProvider>
        {children}
      </ScrapeTargetsProvider>
    </div>
  )
}