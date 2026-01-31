'use client'

import { useTasks } from '@/lib/tasks-context'
import { TaskCard } from '@/components/TaskCard'
import { QuickAdd } from '@/components/QuickAdd'
import { AICoach } from '@/components/AICoach'

export default function DashboardPage() {
  const { getPendingTasks } = useTasks()
  const pendingTasks = getPendingTasks()
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  // Sort by date, then priority
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const completedThisWeek = 12 // TODO: Calculate from context

  return (
    <div className="space-y-5">
      {/* AI Coach */}
      <AICoach taskCount={pendingTasks.length} />
      
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Aujourd'hui</p>
          <h2 className="text-lg font-bold text-gray-800 capitalize">{dateStr}</h2>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span className="text-gray-500">{pendingTasks.length} tâches</span>
        </div>
      </div>
      
      {/* Quick Add */}
      <QuickAdd />
      
      {/* Tasks */}
      {sortedTasks.length > 0 ? (
        <section className="space-y-3">
          {sortedTasks.map((task, i) => (
            <div key={task.id} className="animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
              <TaskCard task={task} />
            </div>
          ))}
        </section>
      ) : (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-lg font-medium text-gray-700">Tout est fait !</p>
          <p className="text-sm text-gray-400">Profite bien de ta journée</p>
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-indigo-600">{pendingTasks.length}</p>
          <p className="text-[10px] text-gray-400">À faire</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-emerald-600">{completedThisWeek}</p>
          <p className="text-[10px] text-gray-400">Cette semaine</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-amber-600">🔥 5</p>
          <p className="text-[10px] text-gray-400">Streak</p>
        </div>
      </div>
    </div>
  )
}
