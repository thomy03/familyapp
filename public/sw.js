// Service Worker for FamilyApp Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('Push received:', event)
  
  let data = { title: 'FamilyApp', body: 'Nouvelle notification', icon: '/icon-192.png' }
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'familyapp-notification',
    renotify: true,
    requireInteraction: data.urgent || false,
    data: {
      url: data.url || '/dashboard',
      taskId: data.taskId
    },
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir' },
      { action: 'done', title: '✓ Fait!' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()

  if (event.action === 'done' && event.notification.data.taskId) {
    // Mark task as done via API
    event.waitUntil(
      fetch('/api/tasks/' + event.notification.data.taskId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
    )
  } else {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/dashboard')
        }
      })
    )
  }
})
