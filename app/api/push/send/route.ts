import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import webpush from "web-push"

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:contact@familyapp.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

export async function POST(request: Request) {
  try {
    // Simple API key check for cron jobs
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "familyapp-cron"}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const currentTime = now.toTimeString().slice(0, 5)
    
    // Get tasks due soon (within 15 minutes) or overdue
    const tasks = await prisma.task.findMany({
      where: {
        status: "PENDING",
        date: { lte: today },
        assigneeId: { not: null }
      },
      include: {
        assignee: {
          include: {
            pushSubscriptions: true
          }
        }
      }
    })

    let sent = 0
    let errors = 0

    for (const task of tasks) {
      if (!task.assignee?.pushSubscriptions?.length) continue

      // Determine notification type
      let title = "📋 Tâche à faire"
      let body = task.title
      let urgent = false

      if (task.date < today) {
        title = "⚠️ Tâche en retard!"
        body = `${task.title} - devait être fait le ${task.date}`
        urgent = true
      } else if (task.time) {
        const taskMinutes = parseInt(task.time.split(":")[0]) * 60 + parseInt(task.time.split(":")[1])
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        const diff = taskMinutes - nowMinutes

        if (diff < 0) {
          title = "🔴 Cest lheure!"
          body = `${task.title} - maintenant!`
          urgent = true
        } else if (diff <= 15) {
          title = "⏰ Bientôt!"
          body = `${task.title} - dans ${diff} min`
        } else {
          continue // Not yet time for notification
        }
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: "/icon-192.png",
        tag: `task-${task.id}`,
        urgent,
        taskId: task.id,
        url: "/dashboard"
      })

      for (const sub of task.assignee.pushSubscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload)
          sent++
        } catch (err: unknown) {
          const error = err as { statusCode?: number }
          console.error("Push error:", error)
          errors++
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
        }
      }
    }

    return NextResponse.json({ sent, errors, checked: tasks.length })
  } catch (error) {
    console.error("Send notifications error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
