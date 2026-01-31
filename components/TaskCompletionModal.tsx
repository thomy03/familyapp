'use client'

import { useState, useEffect } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  points: number
  userName: string
  userTotalPoints: number
  streak: number
}

const feedbackOptions = [
  { emoji: '😊', label: 'Facile', value: 'easy' },
  { emoji: '😅', label: 'Correct', value: 'ok' },
  { emoji: '😤', label: 'Difficile', value: 'hard' },
  { emoji: '🎉', label: 'Fier!', value: 'proud' },
]

export function TaskCompletionModal({ isOpen, onClose, taskTitle, points, userName, userTotalPoints, streak }: Props) {
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setAiMessage(null)
      setFeedback(null)
      setShowConfetti(true)
      
      // Get AI message
      fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'task_completed',
          userName,
          taskTitle,
          taskPoints: points,
          userPoints: userTotalPoints,
          streak,
        }),
      })
        .then(res => res.json())
        .then(data => {
          setAiMessage(data.message)
          setIsLoading(false)
        })
        .catch(() => {
          setAiMessage('Bravo! Tu as terminé cette tâche! 🎉')
          setIsLoading(false)
        })
      
      // Hide confetti after 3s
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [isOpen, userName, taskTitle, points, userTotalPoints, streak])

  const handleFeedback = (value: string) => {
    setFeedback(value)
    // Could save feedback to database here
    setTimeout(onClose, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 animate-slideUp relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                {['🎉', '⭐', '✨', '🎊', '💫'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold text-gray-800">Tâche terminée!</h2>
          <p className="text-gray-500 mt-1">{taskTitle}</p>
        </div>

        {/* Points gained */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white text-center mb-6">
          <p className="text-sm opacity-80">Points gagnés</p>
          <p className="text-4xl font-bold">+{points} ⭐</p>
          <p className="text-xs opacity-70 mt-1">Total: {userTotalPoints + points} pts</p>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="bg-orange-50 rounded-xl p-3 text-center mb-6">
            <p className="text-orange-600 font-bold">🔥 Streak: {streak} jours!</p>
          </div>
        )}

        {/* AI Coach Message */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-xl">🤖</div>
            <div className="flex-1">
              <p className="text-xs text-indigo-600 font-medium mb-1">Coach IA</p>
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700">{aiMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {!feedback ? (
          <div>
            <p className="text-center text-sm text-gray-500 mb-3">Comment c'était ?</p>
            <div className="grid grid-cols-4 gap-2">
              {feedbackOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFeedback(opt.value)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:scale-105 transition-all text-center"
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-[10px] text-gray-500">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-green-600 font-medium py-4">
            Merci pour ton retour! 💚
          </div>
        )}
      </div>
    </div>
  )
}
