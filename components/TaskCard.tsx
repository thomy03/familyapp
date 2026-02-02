"use client"

import { useState, useEffect } from "react"
import { useTasks, Task } from "@/lib/tasks-context"
import { TaskCompletionModal } from "./TaskCompletionModal"
import { Modal } from "./Modal"

const priorityConfig = {
  LOW: { color: "priority-low", emoji: "🟢", label: "Facile" },
  MEDIUM: { color: "priority-medium", emoji: "🟡", label: "Normal" },
  HIGH: { color: "priority-high", emoji: "🟠", label: "Important" },
  URGENT: { color: "priority-urgent", emoji: "🔴", label: "Urgent!" },
}

type FamilyMember = {
  id: string
  name: string | null
  email: string
  avatar: string | null
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
  
  if (diff < 0) return { text: "⚠️ En retard!", urgent: true }
  if (hours < 1) return { text: `🔥 ${Math.max(0, minutes)}min`, urgent: true }
  if (hours < 3) return { text: `🔥 ${hours}h`, urgent: true }
  if (hours < 24) return { text: `${hours}h`, urgent: false }
  if (days === 1) return { text: "Demain", urgent: false }
  return { text: `${days}j`, urgent: false }
}

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === tomorrow.toDateString()) return "Demain"
  
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
}

export function TaskCard({ task }: { task: Task }) {
  const { completeTask, uncompleteTask, deleteTask, updateTaskAssignees, updateTask, tasks } = useTasks()
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [newDate, setNewDate] = useState(task.date)
  const [newTime, setNewTime] = useState(task.time || "")
  
  const config = priorityConfig[task.priority]
  const timeLeft = getTimeLeft(task.date, task.time)

  const assigneeDisplay = task.assignees.length === 0 
    ? { name: "👥 À prendre!", avatar: "👥" }
    : task.assignees.length === 1 
      ? { name: task.assignees[0].name || task.assignees[0].email.split("@")[0], avatar: task.assignees[0].avatar || "👤" }
      : { name: `${task.assignees.length} personnes`, avatar: "👥" }

  const userCompletedTasks = task.assignees.length > 0 
    ? tasks.filter(t => t.assignees.some(a => a.id === task.assignees[0]?.id) && t.status === "COMPLETED")
    : []
  const userTotalPoints = userCompletedTasks.reduce((sum, t) => sum + t.points, 0)
  const streak = 5

  useEffect(() => {
    if (showEditModal) {
      fetch("/api/family/me")
        .then(res => res.json())
        .then(data => {
          if (data.family?.members) {
            setFamilyMembers(data.family.members)
          }
        })
        .catch(() => {})
      setSelectedAssignees(task.assignees.map(a => a.id))
    }
  }, [showEditModal, task.assignees])

  useEffect(() => {
    if (showRescheduleModal) {
      setNewDate(task.date)
      setNewTime(task.time || "")
    }
  }, [showRescheduleModal, task.date, task.time])

  const handleComplete = async () => {
    setIsAnimating(true)
    setIsProcessing(true)
    
    try {
      await completeTask(task.id)
      setShowModal(true)
    } catch (error) {
      console.error("Error completing task:", error)
    }
    
    setIsProcessing(false)
    setIsAnimating(false)
  }

  const handleDelete = async () => {
    if (confirm("Supprimer cette tâche ?")) {
      setIsProcessing(true)
      try {
        await deleteTask(task.id)
      } catch (error) {
        console.error("Error deleting task:", error)
      }
      setIsProcessing(false)
    }
    setShowMenu(false)
  }

  const handleSaveAssignees = async () => {
    setIsProcessing(true)
    try {
      await updateTaskAssignees(task.id, selectedAssignees)
      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating assignees:", error)
    }
    setIsProcessing(false)
  }

  const handleSaveReschedule = async () => {
    setIsProcessing(true)
    try {
      await updateTask(task.id, { 
        date: newDate, 
        time: newTime || null 
      })
      setShowRescheduleModal(false)
    } catch (error) {
      console.error("Error rescheduling task:", error)
    }
    setIsProcessing(false)
  }

  const toggleAssignee = (id: string) => {
    if (selectedAssignees.includes(id)) {
      setSelectedAssignees(selectedAssignees.filter(a => a !== id))
    } else {
      setSelectedAssignees([...selectedAssignees, id])
    }
  }

  if (task.status === "COMPLETED") {
    return (
      <div className="card bg-green-50 border-l-4 border-l-green-400 opacity-75">
        <div className="flex items-start gap-3">
          <button 
            onClick={async () => {
              await uncompleteTask(task.id)
            }}
            className="mt-0.5 w-7 h-7 rounded-full bg-green-500 hover:bg-orange-400 flex items-center justify-center transition-colors"
            title="Annuler la complétion"
          >
            <span className="text-white text-sm">✓</span>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-500 line-through">{task.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600 font-bold">✓ Terminée · +{task.points} pts</span>
            </div>
            {task.assignees.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {task.assignees.map(a => (
                  <span key={a.id} className="text-lg opacity-60">{a.avatar || "👤"}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }


  return (
    <>
      <div className={`card ${config.color} card-interactive ${isAnimating ? "scale-95 opacity-50" : ""} ${isProcessing ? "opacity-70" : ""} relative`}>
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
            
            {/* Date & Time - Clickable to reschedule */}
            <button 
              onClick={() => setShowRescheduleModal(true)}
              className="flex items-center gap-2 mt-1 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors group"
            >
              <span className="text-lg">📅</span>
              <span className="text-sm text-gray-600">{formatDateForDisplay(task.date)}</span>
              {task.time && (
                <>
                  <span className="text-lg">🕐</span>
                  <span className="text-sm font-medium text-indigo-600">{task.time}</span>
                </>
              )}
              <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100">✏️</span>
            </button>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${timeLeft.urgent ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                {timeLeft.text}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">+{task.points} pts</span>
            </div>
            
            <button 
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 mt-2 hover:bg-gray-50 rounded-lg p-1 -ml-1 transition-colors"
            >
              {task.assignees.length > 0 ? (
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 3).map((a, i) => (
                    <span key={a.id} className="text-lg bg-white rounded-full border-2 border-white">{a.avatar || "👤"}</span>
                  ))}
                  {task.assignees.length > 3 && (
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-1">+{task.assignees.length - 3}</span>
                  )}
                </div>
              ) : (
                <span className="text-lg">{assigneeDisplay.avatar}</span>
              )}
              <span className="text-xs text-gray-500">{assigneeDisplay.name}</span>
              <span className="text-xs text-indigo-500">✏️</span>
            </button>
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
              onClick={() => { setShowRescheduleModal(true); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              📅 Changer date/heure
            </button>
            <button 
              onClick={() => { setShowEditModal(true); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
            >
              ✏️ Modifier assignés
            </button>
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

      {/* Reschedule Modal */}
      <Modal isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📅 Reprogrammer la tâche</h2>
          <button onClick={() => setShowRescheduleModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{task.title}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure (optionnel)</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="input"
            />
            {newTime && (
              <button 
                onClick={() => setNewTime("")}
                className="text-xs text-gray-500 mt-1 hover:text-gray-700"
              >
                ✕ Retirer l'heure
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button 
            onClick={() => setShowRescheduleModal(false)}
            className="flex-1 btn bg-gray-100 text-gray-600"
          >
            Annuler
          </button>
          <button 
            onClick={handleSaveReschedule}
            disabled={isProcessing}
            className="flex-1 btn btn-primary"
          >
            {isProcessing ? "..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* Edit Assignees Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Qui fait cette tâche ?</h2>
          <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{task.title}</p>
        
        <div className="space-y-2 max-h-64 overflow-auto">
          {familyMembers.map(m => (
            <button
              key={m.id}
              onClick={() => toggleAssignee(m.id)}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                selectedAssignees.includes(m.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{m.avatar || "👤"}</span>
              <span className="font-medium text-gray-700 flex-1 text-left">
                {m.name || m.email.split("@")[0]}
              </span>
              {selectedAssignees.includes(m.id) && (
                <span className="text-indigo-500 text-lg">✓</span>
              )}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-400 mt-3 text-center">
          {selectedAssignees.length === 0 ? "Personne sélectionné = à prendre" : 
           selectedAssignees.length === 1 ? "1 personne" : 
           `${selectedAssignees.length} personnes (ensemble)`}
        </p>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setShowEditModal(false)}
            className="flex-1 btn bg-gray-100 text-gray-600"
          >
            Annuler
          </button>
          <button 
            onClick={handleSaveAssignees}
            disabled={isProcessing}
            className="flex-1 btn btn-primary"
          >
            {isProcessing ? "..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      <TaskCompletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        taskTitle={task.title}
        points={task.points}
        userName={assigneeDisplay.name}
        userTotalPoints={userTotalPoints + task.points}
        streak={streak}
      />
    </>
  )
}
