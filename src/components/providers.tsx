import { NextAuthProvider } from 'next-auth/react'
import { authOptions } from '@/lib/auth/options'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
