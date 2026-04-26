import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    console.log('=== Versions API called ===')
    const {
      projectId,
      comment,
      protocolJson,
      sapJson,
      icfJson,
      warningsJson,
      gcpSuggestionsJson,
    } = await req.json()

    console.log('Project ID:', projectId)

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const nextVersionNumber = (project.versions?.length || 0) + 1
    const versionLabel = `v${nextVersionNumber.toString().padStart(2, '0')}`

    const version = await prisma.version.create({
      data: {
        projectId,
        versionLabel,
        comment,
        protocolJson: typeof protocolJson === 'string' ? protocolJson : JSON.stringify(protocolJson),
        sapJson: typeof sapJson === 'string' ? sapJson : JSON.stringify(sapJson),
        icfJson: typeof icfJson === 'string' ? icfJson : JSON.stringify(icfJson),
        warningsJson: typeof warningsJson === 'string' ? warningsJson : JSON.stringify(warningsJson),
        gcpSuggestionsJson: typeof gcpSuggestionsJson === 'string' ? gcpSuggestionsJson : JSON.stringify(gcpSuggestionsJson),
      },
    })

    return NextResponse.json(version)
  } catch (error) {
    console.error('Error saving version:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
