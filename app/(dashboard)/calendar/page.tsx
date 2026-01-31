'use client'

import { useState } from 'react'
import { useTasks } from '@/lib/tasks-context'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const difficulties = [
  { id: 'easy', label: 'Facile', emoji: '🟢', multiplier: 1, priority: 'LOW' as const },
  { id: 'normal', label: 'Normal', emoji: '🟡', multiplier: 1.5, priority: 'MEDIUM' as const },
  { id: 'hard', label: 'Difficile', emoji: '🟠', multiplier: 2, priority: 'HIGH' as const },
  { id: 'epic', label: 'Épique', emoji: '🔴', multiplier: 3, priority: 'URGENT' as const },
]

const durations = [
  { id: '5', label: '5 min', points: 5 },
  { id: '15', label: '15 min', points: 10 },
  { id: '30', label: '30 min', points: 15 },
  { id: '60', label: '1h', points: 25 },
  { id: '120', label: '2h+', points: 40 },
]

const familyMembers = [
  { id: '1', name: 'Thomas', emoji: '👨' },
  { id: '2', name: 'Iana', emoji: '👩' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function CalendarPage() {
  const { tasks, addTask, completeTask, getTasksForDate } = useTasks()
  
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  
  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('normal')
  const [newDuration, setNewDuration] = useState('15')
  const [newAssignee, setNewAssignee] = useState('')

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayStr = today.toISOString().split('T')[0]

  const selectedDiff = difficulties.find(d => d.id === newDifficulty)!
  const selectedDur = durations.find(d => d.id === newDuration)!
  const calculatedPoints = Math.round(selectedDur.points * selectedDiff.multiplier)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else { setCurrentMonth(m => m - 1) }
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else { setCurrentMonth(m => m + 1) }
  }

  const getDateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  const handleAddTask = () => {
    if (!selectedDate || !newTitle.trim() || !newAssignee) return
    const member = familyMembers.find(m => m.id === newAssignee)!
    
    addTask({
      title: newTitle.trim(),
      date: selectedDate,
      points: calculatedPoints,
      priority: selectedDiff.priority,
      difficulty: newDifficulty as any,
      duration: newDuration,
      assigneeId: member.id,
      assigneeName: member.name,
    })
    
    setNewTitle('')
    setNewDifficulty('normal')
    setNewDuration('15')
    setNewAssignee('')
    setShowAddTask(false)
  }

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : []

  // Check if date has tasks
  const hasTasksOnDate = (dateStr: string) => {
    return tasks.some(t => t.date === dateStr && t.status === 'PENDING')
  }
  
  const getTaskCountForDate = (dateStr: string) => {
    return tasks.filter(t => t.date === dateStr && t.status === 'PENDING').length
  }

  return (
    <div className="space-y-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-indigo-50">‹</button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">{MONTHS[currentMonth]}</h2>
          <p className="text-sm text-gray-400">{currentYear}</p>
        </div>
        <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-indigo-50">›</button>
      </div>

      {/* Calendar Grid */}
      <div className="card">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
          {DAYS.map(d => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = getDateStr(day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasTasks = hasTasksOnDate(dateStr)
            const taskCount = getTaskCountForDate(dateStr)
            
            return (
              <button key={day} onClick={() => { setSelectedDate(dateStr); setShowAddTask(false) }}
                className={`relative py-2 rounded-xl text-sm font-medium transition-all ${
                  isSelected ? 'bg-indigo-600 text-white shadow-lg' : isToday ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'hover:bg-gray-100 text-gray-700'
                }`}>
                {day}
                {hasTasks && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: Math.min(taskCount, 3) }, (_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-indigo-500" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day */}
      {selectedDate && !showAddTask && (
        <div className="space-y-3 animate-slideUp">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => setShowAddTask(true)} className="btn btn-primary text-sm">+ Ajouter</button>
          </div>
          
          {selectedTasks.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500">Aucune tâche ce jour</p>
              <button onClick={() => setShowAddTask(true)} className="btn btn-primary mt-4">Ajouter une tâche</button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div key={task.id} className={`card border-l-4 ${task.priority === 'URGENT' ? 'border-l-red-500' : task.priority === 'HIGH' ? 'border-l-orange-500' : task.priority === 'MEDIUM' ? 'border-l-yellow-400' : 'border-l-green-400'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-400">👤 {task.assigneeName} · ⭐ {task.points} pts</p>
                    </div>
                    <button onClick={() => completeTask(task.id)} className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center group">
                      <span className="opacity-0 group-hover:opacity-100 text-green-500">✓</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && selectedDate && (
        <div className="card border-2 border-indigo-400 animate-slideUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">📝 Nouvelle tâche</h3>
            <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          
          <div className="space-y-4">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nom de la tâche..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
            
            <div>
              <p className="text-xs text-gray-500 mb-2">Difficulté</p>
              <div className="grid grid-cols-4 gap-2">
                {difficulties.map(d => (
                  <button key={d.id} onClick={() => setNewDifficulty(d.id)} className={`p-2 rounded-xl border-2 text-center ${newDifficulty === d.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                    <div className="text-lg">{d.emoji}</div>
                    <div className="text-[10px]">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Durée</p>
              <div className="flex flex-wrap gap-2">
                {durations.map(d => (
                  <button key={d.id} onClick={() => setNewDuration(d.id)} className={`px-3 py-1.5 rounded-lg text-sm ${newDuration === d.id ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>{d.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Assigné à</p>
              <div className="flex gap-2">
                {familyMembers.map(m => (
                  <button key={m.id} onClick={() => setNewAssignee(m.id)} className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${newAssignee === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Points</span>
              <span className="text-xl font-bold text-amber-600">⭐ {calculatedPoints}</span>
            </div>

            <button onClick={handleAddTask} disabled={!newTitle.trim() || !newAssignee} className="btn btn-primary w-full disabled:opacity-50">Créer la tâche ✨</button>
          </div>
        </div>
      )}

      {!selectedDate && (
        <div className="card bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-sm text-gray-600">Clique sur un jour pour voir ou ajouter des tâches</p>
          </div>
        </div>
      )}
    </div>
  )
}
