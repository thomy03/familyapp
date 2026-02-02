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
      await prisma.taskAssignee.deleteMany({
        where: { taskId: params.id }
      })
      
      if (assigneeIds && assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId: params.id,
            userId
          }))
        })
      }
    }

    // Handle status changes with points
    let pointsChange = 0
    const wasCompleted = existingTask.status === "COMPLETED"
    const willBeCompleted = status === "COMPLETED"
    const willBePending = status === "PENDING"

    // Completing task -> add points
    if (willBeCompleted && !wasCompleted) {
      pointsChange = existingTask.points
    }
    // Uncompleting task -> remove points  
    else if (willBePending && wasCompleted) {
      pointsChange = -existingTask.points
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...updates,
        ...(status && { status }),
        ...(willBeCompleted && { completedAt: new Date() }),
        ...(willBePending && { completedAt: null }),
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

    // Update points for assignees
    if (pointsChange !== 0 && task.assignees.length > 0) {
      const pointsPerPerson = Math.floor(Math.abs(pointsChange) / task.assignees.length)
      const increment = pointsChange > 0 ? pointsPerPerson : -pointsPerPerson
      
      for (const assignee of task.assignees) {
        await prisma.user.update({
          where: { id: assignee.userId },
          data: { points: { increment } }
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
