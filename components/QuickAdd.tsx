'use client'

import { useState, useCallback } from 'react'
import { useTasks } from '@/lib/tasks-context'

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
  { id: '60', label: '1 heure', points: 25 },
  { id: '120', label: '2h+', points: 40 },
]

const familyMembers = [
  { id: '1', name: 'Thomas', emoji: '👨' },
  { id: '2', name: 'Iana', emoji: '👩' },
]

export function QuickAdd() {
  const { addTask } = useTasks()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('normal')
  const [duration, setDuration] = useState('15')
  const [assignee, setAssignee] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiTip, setAiTip] = useState<string | null>(null)
  const [aiSuggested, setAiSuggested] = useState(false)

  const selectedDiff = difficulties.find(d => d.id === difficulty)!
  const selectedDur = durations.find(d => d.id === duration)!
  const calculatedPoints = Math.round(selectedDur.points * selectedDiff.multiplier)

  // Ask AI for suggestion
  const analyzeTask = useCallback(async (taskTitle: string) => {
    if (taskTitle.length < 3) return
    
    setIsAnalyzing(true)
    setAiSuggested(false)
    
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle }),
      })
      
      if (res.ok) {
        const data = await res.json()
        
        // Apply AI suggestions
        if (data.difficulty && difficulties.some(d => d.id === data.difficulty)) {
          setDifficulty(data.difficulty)
        }
        if (data.duration && durations.some(d => d.id === data.duration)) {
          setDuration(data.duration)
        }
        if (data.tip) {
          setAiTip(data.tip)
        }
        setAiSuggested(true)
      }
    } catch (e) {
      console.error('AI suggestion failed:', e)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleNextFromTitle = async () => {
    await analyzeTask(title)
    setStep(2)
  }

  const handleSubmit = () => {
    const member = familyMembers.find(m => m.id === assignee)
    if (!member || !title.trim()) return

    addTask({
      title: title.trim(),
      date: new Date().toISOString().split('T')[0],
      points: calculatedPoints,
      priority: selectedDiff.priority,
      difficulty: difficulty as any,
      duration,
      assigneeId: member.id,
      assigneeName: member.name,
    })
    
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setDifficulty('normal')
    setDuration('15')
    setAssignee('')
    setStep(1)
    setIsOpen(false)
    setAiTip(null)
    setAiSuggested(false)
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="w-full group">
        <div className="card border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-500 flex items-center justify-center transition-all">
              <span className="text-indigo-500 group-hover:text-white text-xl font-light">+</span>
            </div>
            <span className="text-gray-400 group-hover:text-indigo-600 font-medium">Ajouter une tâche</span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="card border-2 border-indigo-400 bg-gradient-to-br from-white to-indigo-50/30 animate-slideUp">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-indigo-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <h3 className="font-semibold text-gray-700">Quelle tâche ?</h3>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Faire les courses, RDV médecin..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && title.trim() && handleNextFromTitle()}
          />
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>🤖</span> L'IA va suggérer difficulté et temps
          </p>
          <div className="flex gap-2">
            <button onClick={resetForm} className="btn bg-gray-100 text-gray-600">Annuler</button>
            <button 
              onClick={handleNextFromTitle} 
              disabled={!title.trim() || isAnalyzing} 
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Analyse...</span>
                </>
              ) : (
                <span>Suivant →</span>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-semibold text-gray-700">Difficulté & Temps</h3>
            </div>
            {aiSuggested && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1">
                <span>🤖</span> Suggéré par IA
              </span>
            )}
          </div>

          {aiTip && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-700 flex items-start gap-2">
              <span>💡</span>
              <span>{aiTip}</span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-2">Difficulté</p>
            <div className="grid grid-cols-4 gap-2">
              {difficulties.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => setDifficulty(d.id)} 
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    difficulty === d.id 
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{d.emoji}</div>
                  <div className="text-[10px] font-medium">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Temps estimé</p>
            <div className="flex flex-wrap gap-2">
              {durations.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => setDuration(d.id)} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    duration === d.id 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Points estimés</span>
            <span className="text-xl font-bold text-amber-600">⭐ {calculatedPoints}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn bg-gray-100 text-gray-600">← Retour</button>
            <button onClick={() => setStep(3)} className="btn btn-primary flex-1">Suivant →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <h3 className="font-semibold text-gray-700">Qui s'en charge ?</h3>
          </div>
          <div className="space-y-2">
            {familyMembers.map(m => (
              <button 
                key={m.id} 
                onClick={() => setAssignee(m.id)} 
                className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  assignee === m.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="font-medium text-gray-700">{m.name}</span>
                {assignee === m.id && <span className="ml-auto text-indigo-500 text-lg">✓</span>}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tâche</span>
              <span className="font-medium truncate ml-2">{title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Difficulté</span>
              <span>{selectedDiff.emoji} {selectedDiff.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Durée</span>
              <span>{selectedDur.label}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Points</span>
              <span className="text-amber-600">⭐ {calculatedPoints}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn bg-gray-100 text-gray-600">← Retour</button>
            <button onClick={handleSubmit} disabled={!assignee} className="btn btn-primary flex-1">Créer ✨</button>
          </div>
        </div>
      )}
    </div>
  )
}
