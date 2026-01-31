import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - Liste les tâches de la famille
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ tasks: [] })
    }

    // Get all tasks for this family
    const tasks = await prisma.task.findMany({
      where: { familyId: user.familyId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
        { priority: 'desc' }
      ]
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Crée une nouvelle tâche
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { title, date, time, points, priority, difficulty, duration, assigneeId } = await request.json()

    if (!title || !date) {
      return NextResponse.json({ error: 'Titre et date requis' }, { status: 400 })
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Vous devez rejoindre une famille' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        date,
        time: time || null,
        points: points || 10,
        priority: priority || 'MEDIUM',
        difficulty: difficulty || 'normal',
        duration: duration || '15',
        familyId: user.familyId,
        assigneeId: assigneeId || user.id,
        createdById: user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
