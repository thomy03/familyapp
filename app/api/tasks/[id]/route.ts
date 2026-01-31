import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// PUT - Met à jour une tâche (compléter, modifier)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { status, completedAt, ...updates } = await request.json()

    // Get user to verify family membership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Verify task belongs to user's family
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!existingTask || existingTask.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...updates,
        ...(status && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // If task completed, add points to assignee
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      await prisma.user.update({
        where: { id: task.assigneeId! },
        data: {
          points: { increment: task.points }
        }
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprime une tâche
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get user to verify family membership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Verify task belongs to user's family
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!existingTask || existingTask.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
