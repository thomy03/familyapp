import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:contact@familyapp.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

function getParisTime() {
  const now = new Date()
  return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }))
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "familyapp-cron"}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const now = getParisTime()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    
    const tasks = await prisma.task.findMany({
      where: {
        status: "PENDING",
        date: { lte: todayStr },
      },
      include: {
        assignees: {
          include: {
            user: {
              include: {
                pushSubscriptions: true
              }
            }
          }
        }
      }
    })

    let sent = 0
    let errors = 0
    const debug: string[] = []

    for (const task of tasks) {
      // Get all push subscriptions from all assignees
      const subscriptions = task.assignees.flatMap(a => 
        a.user.pushSubscriptions.map(sub => ({ ...sub, userName: a.user.name }))
      )
      
      if (subscriptions.length === 0) {
        debug.push(`${task.title}: no subscriptions`)
        continue
      }

      let title = "📋 Tâche à faire"
      let body = task.title
      let urgent = false
      let shouldNotify = true

      if (task.date < todayStr) {
        title = "⚠️ Tâche en retard!"
        body = `${task.title} - devait être fait le ${task.date}`
        urgent = true
      } else if (task.time) {
        const [taskH, taskM] = task.time.split(":").map(Number)
        const taskMinutes = taskH * 60 + taskM
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        const diff = taskMinutes - nowMinutes

        if (diff < -30) shouldNotify = false
        else if (diff < 0) { title = "🔴 C'est l'heure!"; body = `${task.title} - maintenant!`; urgent = true }
        else if (diff <= 15) { title = "⏰ Bientôt!"; body = `${task.title} - dans ${diff} min` }
        else shouldNotify = false
      }

      if (!shouldNotify) continue

      const payload = JSON.stringify({
        title, body, icon: "/icon-192.png", tag: `task-${task.id}`, urgent, taskId: task.id, url: "/dashboard"
      })

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload)
          sent++
        } catch (err: unknown) {
          const error = err as { statusCode?: number }
          errors++
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
        }
      }
    }

    return NextResponse.json({ sent, errors, checked: tasks.length, parisTime: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, debug })
  } catch (error) {
    console.error("Send notifications error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
