'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert } from '@/components/ui/alert'
import { Loader2, Download, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface StudyInput {
  objective?: string
  design?: string
  population?: string
  primaryEndpoints?: string
  secondaryEndpoints?: string
  inclusionCriteria?: string
  exclusionCriteria?: string
  treatmentArms?: string
  duration?: string
  visitSchedule?: string
  safetyNotes?: string
}

interface Version {
  id: string
  versionLabel: string
  comment?: string
  createdAt: string
}

interface Project {
  id: string
  title: string
  therapeuticArea?: string
  phase?: string
  shortDescription?: string
  studyInput?: StudyInput
  versions?: Version[]
}

interface GeneratedData {
  protocol?: { sections: { id: string; title: string; content: string }[] }
  sap_outline?: { sections: { id: string; title: string; content: string }[] }
  icf_outline?: { sections: { id: string; title: string; content: string }[] }
  warnings?: string[]
  gcp_suggestions?: string[]
  disclaimer?: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('protocol')
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null)
  const [saveComment, setSaveComment] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string } | null>(null)
  const [compareResult, setCompareResult] = useState<any>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      console.log('Fetching project:', projectId)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      console.log('Fetch response:', response.status)

      if (!response.ok) {
        console.error('Failed to fetch project:', response.status)
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 404) {
          console.log('Project not found, waiting...')
          return
        }
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      console.log('Project loaded:', data.id)
      setProject(data)
      if (data.versions && data.versions.length > 0) {
        setActiveTab('versions')
      }
    } catch (err) {
      console.error('Error fetching project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveInput = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/study-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...project?.studyInput,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      await fetchProject()
    } catch (err) {
      setError('Failed to save study input')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')

    try {
      console.log('Generating draft for:', project?.title)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project?.title,
          therapeuticArea: project?.therapeuticArea,
          phase: project?.phase,
          ...project?.studyInput,
        }),
      })

      console.log('Generate response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Generation failed')
      }

      const data = await response.json()
      console.log('Generated data:', data)
      console.log('Protocol sections:', data.protocol?.sections)

      setGeneratedData(data)
      setActiveTab('protocol')
    } catch (err) {
      console.error('Generate error:', err)
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveVersion = async () => {
    if (!generatedData) return

    setSavingVersion(true)
    setError('')

    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          comment: saveComment,
          ...generatedData,
        }),
      })

      if (!response.ok) throw new Error('Failed to save version')
      
      setSaveComment('')
      await fetchProject()
      setGeneratedData(null)
      setActiveTab('versions')
    } catch (err) {
      setError('Failed to save version')
    } finally {
      setSavingVersion(false)
    }
  }

  const handleCompare = async () => {
    if (!compareVersions?.v1 || !compareVersions.v2) return

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          version1Id: compareVersions.v1,
          version2Id: compareVersions.v2,
        }),
      })

      if (!response.ok) throw new Error('Comparison failed')
      const data = await response.json()
      setCompareResult(data)
    } catch (err) {
      setError('Failed to compare versions')
    }
  }

  const handleExport = async (format: 'markdown' | 'html' | 'docx') => {
    let dataToExport = generatedData
    
    // Если generatedData нет, попробуем взять последнюю сохраненную версию
    if (!dataToExport && project?.versions && project.versions.length > 0) {
      const lastVersion = project.versions[0]
      dataToExport = {
        protocol: JSON.parse(lastVersion.protocolJson || '{}'),
        sap_outline: JSON.parse(lastVersion.sapJson || '{}'),
        icf_outline: JSON.parse(lastVersion.icfJson || '{}'),
        warnings: JSON.parse(lastVersion.warningsJson || '[]'),
        gcp_suggestions: JSON.parse(lastVersion.gcpSuggestionsJson || '[]'),
        disclaimer: 'AI-generated draft for demonstration purposes only.',
      }
    }
    
    if (!dataToExport) {
      setError('No data to export. Generate or save a draft first.')
      return
    }

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data: dataToExport }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `protocol-draft.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="error">Project not found</Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/projects" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← Back to projects
          </Link>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <div className="text-sm text-gray-600 mt-1">
            {project.therapeuticArea && <span>{project.therapeuticArea} • </span>}
            {project.phase && <span>{project.phase}</span>}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="input">Study Input</TabsTrigger>
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="sap">SAP Outline</TabsTrigger>
          <TabsTrigger value="icf">ICF Outline</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="gcp">GCP Suggestions</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Study Input Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Therapeutic Area</Label>
                  <Input value={project.therapeuticArea || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phase</Label>
                  <Input value={project.phase || ''} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Study Objective</Label>
                <Textarea
                  id="objective"
                  value={project.studyInput?.objective || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, objective: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="design">Study Design</Label>
                <Textarea
                  id="design"
                  value={project.studyInput?.design || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, design: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="population">Patient Population</Label>
                <Textarea
                  id="population"
                  value={project.studyInput?.population || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, population: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryEndpoints">Primary Endpoints</Label>
                <Textarea
                  id="primaryEndpoints"
                  value={project.studyInput?.primaryEndpoints || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, primaryEndpoints: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryEndpoints">Secondary Endpoints</Label>
                <Textarea
                  id="secondaryEndpoints"
                  value={project.studyInput?.secondaryEndpoints || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, secondaryEndpoints: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inclusionCriteria">Inclusion Criteria</Label>
                <Textarea
                  id="inclusionCriteria"
                  value={project.studyInput?.inclusionCriteria || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, inclusionCriteria: e.target.value }
                  })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusionCriteria">Exclusion Criteria</Label>
                <Textarea
                  id="exclusionCriteria"
                  value={project.studyInput?.exclusionCriteria || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, exclusionCriteria: e.target.value }
                  })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentArms">Treatment Arms</Label>
                <Textarea
                  id="treatmentArms"
                  value={project.studyInput?.treatmentArms || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, treatmentArms: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Study Duration</Label>
                <Textarea
                  id="duration"
                  value={project.studyInput?.duration || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, duration: e.target.value }
                  })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitSchedule">Visit Schedule</Label>
                <Textarea
                  id="visitSchedule"
                  value={project.studyInput?.visitSchedule || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, visitSchedule: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyNotes">Safety Considerations</Label>
                <Textarea
                  id="safetyNotes"
                  value={project.studyInput?.safetyNotes || ''}
                  onChange={(e) => setProject({
                    ...project,
                    studyInput: { ...project.studyInput, safetyNotes: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSaveInput} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Input'}
                </Button>
                <Button onClick={handleGenerate} disabled={generating || !project.studyInput?.objective}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Draft'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocol">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Protocol Draft</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('markdown')}>
                  <Download className="h-4 w-4 mr-2" />
                  MD
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('html')}>
                  <Download className="h-4 w-4 mr-2" />
                  HTML
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('docx')}>
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generatedData?.protocol ? (
                <div className="space-y-6">
                  {Object.entries(generatedData.protocol).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <h3 className="text-lg font-semibold mb-2 capitalize">{key.replace(/_/g, ' ')}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                    </div>
                  ))}
                  {generatedData.disclaimer && (
                    <Alert className="mt-6">
                      {generatedData.disclaimer}
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Generate a draft from the Study Input form to see the protocol here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sap">
          <Card>
            <CardHeader>
              <CardTitle>SAP Outline</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedData?.sap_outline?.sections ? (
                <div className="space-y-6">
                  {generatedData.sap_outline.sections.map((section) => (
                    <div key={section.id}>
                      <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Generate a draft to see the SAP outline here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icf">
          <Card>
            <CardHeader>
              <CardTitle>ICF Outline</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedData?.icf_outline?.sections ? (
                <div className="space-y-6">
                  {generatedData.icf_outline.sections.map((section) => (
                    <div key={section.id}>
                      <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Generate a draft to see the ICF outline here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedData?.warnings && generatedData.warnings.length > 0 ? (
                <div className="space-y-2">
                  {generatedData.warnings.map((warning, idx) => (
                    <Alert key={idx} variant="warning">
                      {warning}
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No warnings detected.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gcp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                GCP Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedData?.gcp_suggestions && generatedData.gcp_suggestions.length > 0 ? (
                <div className="space-y-2">
                  {generatedData.gcp_suggestions.map((suggestion, idx) => (
                    <Alert key={idx} variant="success">
                      {suggestion}
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No suggestions available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedData && (
                  <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-md">
                    <Alert>
                      Save this generated draft as a new version.
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="comment">Version Comment</Label>
                      <Input
                        id="comment"
                        value={saveComment}
                        onChange={(e) => setSaveComment(e.target.value)}
                        placeholder="Optional comment about this version"
                      />
                    </div>
                    <Button onClick={handleSaveVersion} disabled={savingVersion}>
                      {savingVersion ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save as New Version
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {project.versions && project.versions.length > 0 && (
                  <>
                    {compareMode ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Version 1</Label>
                            <Select
                              value={compareVersions?.v1}
                              onValueChange={(v) => setCompareVersions({ ...compareVersions, v1: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {project.versions.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.versionLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Version 2</Label>
                            <Select
                              value={compareVersions?.v2}
                              onValueChange={(v) => setCompareVersions({ ...compareVersions, v2: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {project.versions.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.versionLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCompare}>Compare</Button>
                          <Button variant="outline" onClick={() => { setCompareMode(false); setCompareResult(null); }}>
                            Cancel
                          </Button>
                        </div>
                        {compareResult && (
                          <div className="space-y-4 mt-4">
                            <h4 className="font-semibold">Comparison Results</h4>
                            <div>
                              <h5 className="text-sm font-medium text-green-600">Added:</h5>
                              <ul className="list-disc list-inside text-sm ml-4">
                                {compareResult.addedSections?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-red-600">Removed:</h5>
                              <ul className="list-disc list-inside text-sm ml-4">
                                {compareResult.removedSections?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-blue-600">Changed:</h5>
                              <ul className="list-disc list-inside text-sm ml-4">
                                {compareResult.changedSections?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {project.versions.map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50"
                            >
                              <div>
                                <span className="font-medium">{version.versionLabel}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(version.createdAt).toLocaleString()}
                                </span>
                                {version.comment && (
                                  <p className="text-sm text-gray-600 mt-1">{version.comment}</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveTab('protocol')
                                  setGeneratedData({
                                    protocol: JSON.parse(version.protocolJson || '{}'),
                                    sap_outline: JSON.parse(version.sapJson || '{}'),
                                    icf_outline: JSON.parse(version.icfJson || '{}'),
                                    warnings: JSON.parse(version.warningsJson || '[]'),
                                    gcp_suggestions: JSON.parse(version.gcpSuggestionsJson || '[]'),
                                  })
                                }}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setCompareMode(true)}>
                            Compare Versions
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
