import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    console.log('=== Projects API called ===')
    const body = await req.json()
    console.log('Request body:', body)

    // Если есть projectId - это запрос на получение проекта
    if (body.projectId) {
      console.log('Fetching project:', body.projectId)
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
        include: {
          studyInput: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!project) {
        console.log('Project not found')
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      console.log('Project found:', project.id)
      return NextResponse.json(project)
    }

    // Иначе - это создание проекта
    const { title, therapeuticArea, phase, shortDescription } = body

    if (!title) {
      console.log('Title is missing')
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    console.log('Creating project with title:', title)
    const users = await prisma.user.findMany({ take: 1 })
    console.log('Users found:', users.length)
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 500 }
      )
    }
    const userId = users[0].id
    console.log('Using userId:', userId)

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        therapeuticArea,
        phase,
        shortDescription,
        studyInput: {
          create: {},
        },
      },
      include: {
        studyInput: true,
      },
    })

    console.log('Project created:', project.id)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error in projects API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    // Для MVP используем первого пользователя из БД
    const users = await prisma.user.findMany({ take: 1 })
    if (users.length === 0) {
      return NextResponse.json([])
    }
    const userId = users[0].id

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        studyInput: true,
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
