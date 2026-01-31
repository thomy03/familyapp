'use client'

import { useState } from 'react'
import { useTasks, Task } from '@/lib/tasks-context'
import { TaskCompletionModal } from './TaskCompletionModal'

const priorityConfig = {
  LOW: { color: 'priority-low', emoji: '🟢', label: 'Facile' },
  MEDIUM: { color: 'priority-medium', emoji: '🟡', label: 'Normal' },
  HIGH: { color: 'priority-high', emoji: '🟠', label: 'Important' },
  URGENT: { color: 'priority-urgent', emoji: '🔴', label: 'Urgent!' },
}

function getTimeLeft(date: string): { text: string; urgent: boolean } {
  const taskDate = new Date(date + 'T23:59:59')
  const now = new Date()
  const diff = taskDate.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (diff < 0) return { text: '⚠️ En retard!', urgent: true }
  if (hours < 3) return { text: `🔥 ${Math.max(0, hours)}h restantes`, urgent: true }
  if (hours < 24) return { text: `${hours}h restantes`, urgent: false }
  if (days === 1) return { text: 'Demain', urgent: false }
  return { text: `${days} jours`, urgent: false }
}

export function TaskCard({ task }: { task: Task }) {
  const { completeTask, tasks } = useTasks()
  const [showModal, setShowModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const config = priorityConfig[task.priority]
  const timeLeft = getTimeLeft(task.date)

  // Calculate user stats
  const userCompletedTasks = tasks.filter(t => t.assigneeId === task.assigneeId && t.status === 'COMPLETED')
  const userTotalPoints = userCompletedTasks.reduce((sum, t) => sum + t.points, 0)
  const streak = 5 // TODO: Calculate real streak

  const handleComplete = () => {
    setIsAnimating(true)
    setTimeout(() => {
      completeTask(task.id)
      setShowModal(true)
    }, 300)
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  if (task.status === 'COMPLETED') {
    return null // Hide completed tasks
  }

  return (
    <>
      <div className={`card ${config.color} card-interactive ${isAnimating ? 'scale-95 opacity-50' : ''}`}>
        <div className="flex items-start gap-3">
          <button 
            onClick={handleComplete} 
            className="mt-0.5 w-7 h-7 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center group transition-all"
          >
            <span className="text-green-500 opacity-0 group-hover:opacity-100 text-sm">✓</span>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${timeLeft.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {timeLeft.text}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">+{task.points} pts</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-[10px]">{task.assigneeName[0]}</div>
              <span className="text-xs text-gray-500">{task.assigneeName}</span>
            </div>
          </div>
          <div className="text-xl" title={config.label}>{config.emoji}</div>
        </div>
      </div>

      <TaskCompletionModal
        isOpen={showModal}
        onClose={handleModalClose}
        taskTitle={task.title}
        points={task.points}
        userName={task.assigneeName}
        userTotalPoints={userTotalPoints}
        streak={streak}
      />
    </>
  )
}
