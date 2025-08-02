import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-pickle-dark flex items-center justify-center">
      <SignIn 
        afterSignInUrl="/admin"
        afterSignUpUrl="/admin"
      />
    </div>
  )
}