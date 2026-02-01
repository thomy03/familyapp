import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { status, assigneeIds, ...updates } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: { assignees: true }
    })

    if (!existingTask || existingTask.familyId !== user.familyId) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    // Update assignees if provided
    if (assigneeIds !== undefined) {
      // Delete existing assignees
      await prisma.taskAssignee.deleteMany({
        where: { taskId: params.id }
      })
      
      // Create new assignees
      if (assigneeIds && assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId: params.id,
            userId
          }))
        })
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...updates,
        ...(status && { status }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })

    // If task completed, add points to all assignees
    if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      const pointsPerPerson = Math.floor(task.points / Math.max(1, task.assignees.length))
      
      for (const assignee of task.assignees) {
        await prisma.user.update({
          where: { id: assignee.userId },
          data: { points: { increment: pointsPerPerson } }
        })
      }
    }

    return NextResponse.json({ 
      task: {
        ...task,
        assignees: task.assignees.map(a => a.user)
      }
    })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!existingTask || existingTask.familyId !== user.familyId) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
