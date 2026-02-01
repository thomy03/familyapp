import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ tasks: [] })
    }

    const tasks = await prisma.task.findMany({
      where: { familyId: user.familyId },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { date: "asc" },
        { time: "asc" },
        { priority: "desc" }
      ]
    })

    // Transform to include assignees array
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignees: task.assignees.map(a => a.user)
    }))

    return NextResponse.json({ tasks: transformedTasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { title, date, time, points, priority, difficulty, duration, assigneeIds } = await request.json()

    if (!title || !date) {
      return NextResponse.json({ error: "Titre et date requis" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: "Vous devez rejoindre une famille" }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        date,
        time: time || null,
        points: points || 10,
        priority: priority || "MEDIUM",
        difficulty: difficulty || "normal",
        duration: duration || "15",
        familyId: user.familyId,
        createdById: user.id,
        assignees: assigneeIds && assigneeIds.length > 0 ? {
          create: assigneeIds.map((id: string) => ({ userId: id }))
        } : undefined
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

    return NextResponse.json({ 
      task: {
        ...task,
        assignees: task.assignees.map(a => a.user)
      }
    })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
