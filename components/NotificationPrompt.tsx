"use client"

import { useState, useEffect } from "react"

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported")
      return
    }

    setPermission(Notification.permission)
    
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
        if (!sub && Notification.permission === "default") {
          // Show prompt after 3 seconds
          setTimeout(() => setShowPrompt(true), 3000)
        }
      })
    })

    // Register service worker
    navigator.serviceWorker.register("/sw.js").catch(console.error)
  }, [])

  const subscribe = async () => {
    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      
      if (perm !== "granted") {
        setIsLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      // Send subscription to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      })

      if (res.ok) {
        setIsSubscribed(true)
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Subscribe error:", error)
    }
    setIsLoading(false)
  }

  if (permission === "unsupported" || isSubscribed || permission === "denied") {
    return null
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl p-4 z-50 animate-slideUp border border-indigo-100">
      <div className="flex gap-3">
        <div className="text-3xl">🔔</div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Activer les notifications?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Reçois des rappels pour ne jamais oublier tes tâches!
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? "..." : "Activer"}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
