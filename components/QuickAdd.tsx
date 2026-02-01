"use client"

import { useState, useCallback, useEffect } from "react"
import { useTasks } from "@/lib/tasks-context"
import { useSession } from "next-auth/react"

const difficulties = [
  { id: "easy", label: "Facile", emoji: "🟢", multiplier: 1, priority: "LOW" as const },
  { id: "normal", label: "Normal", emoji: "🟡", multiplier: 1.5, priority: "MEDIUM" as const },
  { id: "hard", label: "Difficile", emoji: "🟠", multiplier: 2, priority: "HIGH" as const },
  { id: "epic", label: "Épique", emoji: "🔴", multiplier: 3, priority: "URGENT" as const },
]

const durations = [
  { id: "5", label: "5 min", points: 5 },
  { id: "15", label: "15 min", points: 10 },
  { id: "30", label: "30 min", points: 15 },
  { id: "60", label: "1 heure", points: 25 },
  { id: "120", label: "2h+", points: 40 },
]

type FamilyMember = {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

export function QuickAdd() {
  const { addTask } = useTasks()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState("normal")
  const [duration, setDuration] = useState("15")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split("T")[0])
  const [taskTime, setTaskTime] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiTip, setAiTip] = useState<string | null>(null)
  const [aiSuggested, setAiSuggested] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    fetch("/api/family/me")
      .then(res => res.json())
      .then(data => {
        if (data.family?.members) {
          setFamilyMembers(data.family.members)
        }
      })
      .catch(() => {})
  }, [])

  const selectedDiff = difficulties.find(d => d.id === difficulty)!
  const selectedDur = durations.find(d => d.id === duration)!
  const calculatedPoints = Math.round(selectedDur.points * selectedDiff.multiplier)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (dateStr === today.toISOString().split("T")[0]) return "Aujourd'hui"
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Demain"
    
    return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
  }

  const analyzeTask = useCallback(async (taskTitle: string) => {
    if (taskTitle.length < 3) return
    
    setIsAnalyzing(true)
    setAiSuggested(false)
    
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskTitle }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.difficulty) setDifficulty(data.difficulty)
        if (data.duration) setDuration(data.duration)
        if (data.tip) setAiTip(data.tip)
        setAiSuggested(true)
      }
    } catch {}
    setIsAnalyzing(false)
  }, [])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (value.length >= 5) {
      const timer = setTimeout(() => analyzeTask(value), 500)
      return () => clearTimeout(timer)
    }
  }

  const handleSubmit = async () => {
    if (!title) return
    setIsSubmitting(true)
    
    await addTask({
      title,
      date: taskDate,
      time: taskTime || undefined,
      points: calculatedPoints,
      priority: selectedDiff.priority,
      difficulty,
      duration,
      assigneeIds,
    })
    
    setTitle("")
    setDifficulty("normal")
    setDuration("15")
    setAssigneeIds([])
    setTaskDate(new Date().toISOString().split("T")[0])
    setTaskTime("")
    setAiTip(null)
    setAiSuggested(false)
    setStep(1)
    setIsOpen(false)
    setIsSubmitting(false)
  }

  const toggleAssignee = (id: string) => {
    if (assigneeIds.includes(id)) {
      setAssigneeIds(assigneeIds.filter(a => a !== id))
    } else {
      setAssigneeIds([...assigneeIds, id])
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-40 hover:scale-110 transition-transform">
        +
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setIsOpen(false)}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">✨ Nouvelle tâche</h3>
            <input
              type="text"
              placeholder="Que dois-tu faire ?"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="input text-lg"
              autoFocus
            />
            {isAnalyzing && <p className="text-sm text-indigo-500">🤖 Analyse...</p>}
            <button onClick={() => setStep(2)} disabled={!title} className="btn btn-primary w-full py-3">
              Continuer →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">📅 Quand ?</h3>
            <div className="flex gap-2">
              {[0, 1, 2].map(offset => {
                const d = new Date()
                d.setDate(d.getDate() + offset)
                const dateStr = d.toISOString().split("T")[0]
                return (
                  <button
                    key={offset}
                    onClick={() => setTaskDate(dateStr)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      taskDate === dateStr ? "bg-indigo-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {offset === 0 ? "Aujourd'hui" : offset === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </button>
                )
              })}
            </div>
            <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="input" />
            
            <h3 className="font-semibold text-gray-700 pt-2">🕐 Heure (optionnel)</h3>
            <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="input" />
            
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn bg-gray-100 text-gray-600">← Retour</button>
              <button onClick={() => setStep(3)} className="btn btn-primary flex-1">Suivant →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">⚡ Difficulté & Temps</h3>
              {aiSuggested && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">🤖 Suggéré</span>}
            </div>

            {aiTip && (
              <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700">💡 {aiTip}</div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {difficulties.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-2 rounded-xl border-2 text-center ${difficulty === d.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                >
                  <div className="text-xl">{d.emoji}</div>
                  <div className="text-[10px]">{d.label}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {durations.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDuration(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${duration === d.id ? "bg-indigo-500 text-white" : "bg-gray-100"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 rounded-xl p-3 flex justify-between">
              <span className="text-gray-600">Points estimés</span>
              <span className="font-bold text-amber-600">⭐ {calculatedPoints}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn bg-gray-100 text-gray-600">← Retour</button>
              <button onClick={() => setStep(4)} className="btn btn-primary flex-1">Suivant →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">👥 Qui s'en charge ?</h3>
            <p className="text-xs text-gray-500">Sélectionne une ou plusieurs personnes (ou aucune)</p>
            
            <div className="space-y-2 max-h-48 overflow-auto">
              {familyMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleAssignee(m.id)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 ${
                    assigneeIds.includes(m.id) ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{m.avatar || "👤"}</span>
                  <span className="font-medium flex-1 text-left">{m.name || m.email.split("@")[0]}</span>
                  {assigneeIds.includes(m.id) && <span className="text-indigo-500">✓</span>}
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-gray-400">
              {assigneeIds.length === 0 ? "👥 Non assigné = à prendre par n'importe qui" :
               assigneeIds.length === 1 ? "👤 1 personne assignée" :
               `👥 ${assigneeIds.length} personnes (ensemble)`}
            </p>

            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Tâche</span><span className="truncate ml-2">{title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(taskDate)} {taskTime && `à ${taskTime}`}</span></div>
              <div className="flex justify-between font-bold"><span className="text-gray-500">Points</span><span className="text-amber-600">⭐ {calculatedPoints}</span></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="btn bg-gray-100 text-gray-600">← Retour</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary flex-1">
                {isSubmitting ? "Création..." : "Créer ✨"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
