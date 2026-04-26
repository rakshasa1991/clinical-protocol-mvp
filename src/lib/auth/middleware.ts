import { getServerSession } from 'next-auth'
import { authOptions } from './options'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect('/login')
  }
  
  return session.user
}
