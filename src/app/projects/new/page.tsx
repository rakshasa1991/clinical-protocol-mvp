'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

const therapeuticAreas = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Immunology',
  'Infectious Diseases',
  'Respiratory',
  'Endocrinology',
  'Gastroenterology',
  'Dermatology',
  'Other',
]

const phases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV']

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    therapeuticArea: '',
    phase: '',
    shortDescription: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== Creating project ===')
    console.log('FormData:', formData)
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response:', responseText)

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const project = JSON.parse(responseText)
      console.log('Project created:', project.id)
      router.push(`/projects/${project.id}`)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to create project. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/projects" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to projects
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="error">{error}</Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Study Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter study title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="therapeuticArea">Therapeutic Area</Label>
                <Select
                  value={formData.therapeuticArea}
                  onValueChange={(value) => setFormData({ ...formData, therapeuticArea: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapeutic area" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapeuticAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase">Phase</Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value) => setFormData({ ...formData, phase: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief description of the study"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
                <Link href="/projects">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
