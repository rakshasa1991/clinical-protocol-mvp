import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    console.log('=== Compare API called ===')
    const { projectId, version1Id, version2Id } = await req.json()

    if (!projectId || !version1Id || !version2Id) {
      return NextResponse.json(
        { error: 'Project ID and both version IDs are required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const [version1, version2] = await Promise.all([
      prisma.version.findUnique({ where: { id: version1Id } }),
      prisma.version.findUnique({ where: { id: version2Id } }),
    ])

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      )
    }

    const parseJson = (str: string | null) => {
      if (!str) return null
      try {
        return JSON.parse(str)
      } catch {
        return null
      }
    }

    const v1Protocol = parseJson(version1.protocolJson)
    const v2Protocol = parseJson(version2.protocolJson)

    const addedSections: string[] = []
    const removedSections: string[] = []
    const changedSections: string[] = []

    if (v1Protocol?.sections && v2Protocol?.sections) {
      const v1Ids = new Set(v1Protocol.sections.map((s: any) => s.id))
      const v2Ids = new Set(v2Protocol.sections.map((s: any) => s.id))

      v2Protocol.sections.forEach((section: any) => {
        if (!v1Ids.has(section.id)) {
          addedSections.push(section.title || section.id)
        } else {
          const v1Section = v1Protocol.sections.find(
            (s: any) => s.id === section.id
          )
          if (v1Section && v1Section.content !== section.content) {
            changedSections.push(section.title || section.id)
          }
        }
      })

      v1Protocol.sections.forEach((section: any) => {
        if (!v2Ids.has(section.id)) {
          removedSections.push(section.title || section.id)
        }
      })
    }

    return NextResponse.json({
      addedSections,
      removedSections,
      changedSections,
      version1: {
        label: version1.versionLabel,
        createdAt: version1.createdAt,
      },
      version2: {
        label: version2.versionLabel,
        createdAt: version2.createdAt,
      },
    })
  } catch (error) {
    console.error('Error comparing versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
