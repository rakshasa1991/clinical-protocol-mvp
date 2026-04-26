import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/projects')
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Clinical Protocol MVP
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered tool for generating clinical study protocol drafts, SAP outlines, and ICF outlines.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                Login to Continue
              </Button>
            </Link>
            <p className="text-sm text-gray-500 text-center">
              Demo credentials available in README
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
