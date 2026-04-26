'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Project {
  id: string
  title: string
  therapeuticArea?: string
  phase?: string
  shortDescription?: string
  updatedAt: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(stored))
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link href="/projects/new">
              <Button>Create your first project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {project.therapeuticArea && (
                      <div>
                        <span className="font-medium">Therapeutic Area:</span> {project.therapeuticArea}
                      </div>
                    )}
                    {project.phase && (
                      <div>
                        <span className="font-medium">Phase:</span> {project.phase}
                      </div>
                    )}
                    {project.shortDescription && (
                      <div className="mt-2 line-clamp-2">
                        {project.shortDescription}
                      </div>
                    )}
                    <div className="pt-2 text-xs text-gray-400">
                      Updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
