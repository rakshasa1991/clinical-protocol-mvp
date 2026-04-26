import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    console.log('=== Study Input API called ===')
    const {
      projectId,
      objective,
      design,
      population,
      primaryEndpoints,
      secondaryEndpoints,
      inclusionCriteria,
      exclusionCriteria,
      treatmentArms,
      duration,
      visitSchedule,
      safetyNotes,
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
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const studyInput = await prisma.studyInput.upsert({
      where: { projectId },
      update: {
        objective,
        design,
        population,
        primaryEndpoints,
        secondaryEndpoints,
        inclusionCriteria,
        exclusionCriteria,
        treatmentArms,
        duration,
        visitSchedule,
        safetyNotes,
      },
      create: {
        projectId,
        objective,
        design,
        population,
        primaryEndpoints,
        secondaryEndpoints,
        inclusionCriteria,
        exclusionCriteria,
        treatmentArms,
        duration,
        visitSchedule,
        safetyNotes,
      },
    })

    console.log('Study input saved')
    return NextResponse.json(studyInput)
  } catch (error) {
    console.error('Error saving study input:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
