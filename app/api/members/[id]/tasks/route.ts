import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const memberId = params.id

    // Get completed tasks for this member
    const tasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        assignees: {
          some: {
            userId: memberId
          }
        }
      },
      select: {
        id: true,
        title: true,
        points: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 20
    })

    // Get task count stats
    const totalCompleted = await prisma.task.count({
      where: {
        status: 'COMPLETED',
        assignees: {
          some: {
            userId: memberId
          }
        }
      }
    })

    return NextResponse.json({ 
      tasks,
      stats: {
        totalCompleted
      }
    })
  } catch (error) {
    console.error('Get member tasks error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
