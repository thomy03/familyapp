'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type FamilyMember = {
  id: string
  name: string | null
  email: string
  points: number
}

type Props = {
  taskCount?: number
}

export function AICoach({ taskCount = 0 }: Props) {
  const { data: session } = useSession()
  const [mode, setMode] = useState<'message' | 'competition' | 'chat'>('message')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string; content: string}[]>([])
  const [familyRanking, setFamilyRanking] = useState<FamilyMember[]>([])

  const userName = session?.user?.name?.split(' ')[0] || 'ami(e)'

  // Fetch family data
  useEffect(() => {
    fetch('/api/family/me')
      .then(res => res.json())
      .then(data => {
        if (data.family?.members) {
          const sorted = [...data.family.members].sort((a, b) => b.points - a.points)
          setFamilyRanking(sorted)
        }
      })
      .catch(() => {})
  }, [])

  // Initial motivation message
  useEffect(() => {
    const messages = taskCount > 0
      ? [
          `Hey ${userName}! ${taskCount} tâche${taskCount !== 1 ? 's' : ''} aujourd'hui. Tu gères! 💪`,
          `Salut ${userName}! Prêt à conquérir la journée? 🚀`,
          `C'est parti ${userName}! ${taskCount} mission${taskCount !== 1 ? 's' : ''} t'attend${taskCount !== 1 ? 'ent' : ''}! 🎯`,
        ]
      : [
          `Hey ${userName}! Journée libre, pas de tâches! 🎉`,
          `Salut ${userName}! Tout est fait, profite bien! ✨`,
          `Bravo ${userName}! Zéro tâche en attente! 🏆`,
        ]
    setMessage(messages[Math.floor(Math.random() * messages.length)])
  }, [taskCount, userName])

  const handleCompetition = () => {
    setMode(mode === 'competition' ? 'message' : 'competition')
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return
    
    setChatHistory(prev => [...prev, { role: 'user', content: chatInput }])
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          userName,
          message: chatInput,
        }),
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Je suis là pour toi! Continue comme ça! 💪' }])
    }
    
    setChatInput('')
    setIsLoading(false)
  }

  const emojis = ['👨', '👩', '👦', '👧', '👶', '🧑']

  return (
    <div className="space-y-2">
      {/* Main Coach Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="absolute top-2 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse" />
        
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-lg">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/80 text-xs font-medium">Coach IA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-white font-medium text-sm leading-snug">
              {isLoading ? '...' : message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button 
            onClick={handleCompetition}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <span>🏆</span>
            <span>Classement</span>
          </button>
          <button 
            onClick={() => setMode(mode === 'chat' ? 'message' : 'chat')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <span>💬</span>
            <span>{mode === 'chat' ? 'Fermer' : 'Parler'}</span>
          </button>
        </div>
      </div>

      {/* Competition panel */}
      {mode === 'competition' && (
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 animate-slideUp">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🏆</span> Classement Famille
          </h3>
          {familyRanking.length > 0 ? (
            <div className="space-y-2">
              {familyRanking.map((member, i) => (
                <div key={member.id} className={`flex items-center gap-3 p-2 rounded-xl ${i === 0 ? 'bg-amber-100' : 'bg-white'}`}>
                  <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                  <span className="text-xl">{emojis[i % emojis.length]}</span>
                  <span className="flex-1 font-medium">{member.name || member.email.split('@')[0]}</span>
                  <span className="font-bold text-amber-600">{member.points} pts</span>
                  {i === 0 && <span>👑</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Pas encore de classement. Invite ta famille ! 🏠
            </p>
          )}
        </div>
      )}

      {/* Chat panel */}
      {mode === 'chat' && (
        <div className="card animate-slideUp">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>💬</span> Parle au Coach
          </h3>
          
          {chatHistory.length > 0 && (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {chatHistory.slice(-4).map((msg, i) => (
                <div key={i} className={`text-sm p-2 rounded-xl ${msg.role === 'user' ? 'bg-indigo-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                  {msg.content}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="Comment tu te sens ?"
              className="flex-1 bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleChat}
              disabled={!chatInput.trim() || isLoading}
              className="btn btn-primary px-4"
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
