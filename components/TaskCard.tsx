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

function getTimeLeft(date: string, time?: string | null): { text: string; urgent: boolean } {
  const taskDateTime = time 
    ? new Date(`${date}T${time}:00`)
    : new Date(`${date}T23:59:59`)
  
  const now = new Date()
  const diff = taskDateTime.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const days = Math.floor(hours / 24)
  
  if (diff < 0) return { text: '⚠️ En retard!', urgent: true }
  if (hours < 1) return { text: `🔥 ${Math.max(0, minutes)}min`, urgent: true }
  if (hours < 3) return { text: `🔥 ${hours}h`, urgent: true }
  if (hours < 24) return { text: `${hours}h`, urgent: false }
  if (days === 1) return { text: 'Demain', urgent: false }
  return { text: `${days}j`, urgent: false }
}

export function TaskCard({ task }: { task: Task }) {
  const { completeTask, deleteTask, tasks } = useTasks()
  const [showModal, setShowModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const config = priorityConfig[task.priority]
  const timeLeft = getTimeLeft(task.date, task.time)

  // Get assignee info
  const assigneeName = task.assignee?.name || task.assignee?.email?.split('@')[0] || 'Non assigné'
  const assigneeAvatar = task.assignee?.avatar || '👤'

  // Calculate user stats
  const userCompletedTasks = tasks.filter(t => t.assigneeId === task.assigneeId && t.status === 'COMPLETED')
  const userTotalPoints = userCompletedTasks.reduce((sum, t) => sum + t.points, 0)
  const streak = 5 // TODO: Calculate real streak

  const handleComplete = async () => {
    setIsAnimating(true)
    setIsProcessing(true)
    
    try {
      await completeTask(task.id)
      setShowModal(true)
    } catch (error) {
      console.error('Error completing task:', error)
    }
    
    setIsProcessing(false)
    setIsAnimating(false)
  }

  const handleDelete = async () => {
    if (confirm('Supprimer cette tâche ?')) {
      setIsProcessing(true)
      try {
        await deleteTask(task.id)
      } catch (error) {
        console.error('Error deleting task:', error)
      }
      setIsProcessing(false)
    }
    setShowMenu(false)
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  if (task.status === 'COMPLETED') {
    return null
  }

  return (
    <>
      <div className={`card ${config.color} card-interactive ${isAnimating ? 'scale-95 opacity-50' : ''} ${isProcessing ? 'opacity-70' : ''} relative`}>
        <div className="flex items-start gap-3">
          <button 
            onClick={handleComplete}
            disabled={isProcessing}
            className="mt-0.5 w-7 h-7 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center group transition-all disabled:opacity-50"
          >
            <span className="text-green-500 opacity-0 group-hover:opacity-100 text-sm">✓</span>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
            
            {/* Time display for appointments */}
            {task.time && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg">🕐</span>
                <span className="text-sm font-medium text-indigo-600">{task.time}</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${timeLeft.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {timeLeft.text}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">+{task.points} pts</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">{assigneeAvatar}</span>
              <span className="text-xs text-gray-500">{assigneeName}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-xl" title={config.label}>{config.emoji}</div>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ⋮
            </button>
          </div>
        </div>

        {showMenu && (
          <div className="absolute right-2 top-12 bg-white shadow-lg rounded-xl border border-gray-100 py-1 z-10">
            <button 
              onClick={handleDelete}
              disabled={isProcessing}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>

      <TaskCompletionModal
        isOpen={showModal}
        onClose={handleModalClose}
        taskTitle={task.title}
        points={task.points}
        userName={assigneeName}
        userTotalPoints={userTotalPoints + task.points}
        streak={streak}
      />
    </>
  )
}
