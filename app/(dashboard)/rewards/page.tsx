'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const rewards = [
  { id: '1', title: 'Choix du film', cost: 100, icon: '🎬' },
  { id: '2', title: 'Resto au choix', cost: 500, icon: '🍕' },
  { id: '3', title: 'Journée off', cost: 1000, icon: '🏖️' },
  { id: '4', title: 'Cadeau surprise', cost: 2000, icon: '🎁' },
]

const badgesList = [
  { name: 'Première tâche', icon: '🌟', condition: 'firstTask' },
  { name: 'Streak 7 jours', icon: '🔥', condition: 'streak7' },
  { name: 'Roi de la semaine', icon: '👑', condition: 'weeklyKing' },
  { name: '100% du mois', icon: '🎯', condition: 'monthPerfect' },
  { name: 'Comeback', icon: '💪', condition: 'comeback' },
]

export default function RewardsPage() {
  const { data: session } = useSession()
  const [userPoints, setUserPoints] = useState(0)
  const [userStreak, setUserStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserPoints(data.user.points || 0)
            setUserStreak(data.user.streak || 0)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session])

  // Calculer les badges gagnés (pour l'instant basé sur les points/streak)
  const earnedBadges = {
    firstTask: userPoints > 0,
    streak7: userStreak >= 7,
    weeklyKing: false, // À implémenter
    monthPerfect: false, // À implémenter
    comeback: false, // À implémenter
  }

  const getMessage = () => {
    if (userPoints === 0) return "Commence à gagner des points ! 🎯"
    if (userPoints < 100) return "Encore un peu pour ta 1ère récompense ! 💪"
    if (userPoints < 500) return "Continue comme ça ! 🚀"
    return "Tu es une machine ! 🔥"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Points */}
      <div className="card bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center">
        <p className="text-sm opacity-80">Tes points</p>
        <p className="text-4xl font-bold">{userPoints}</p>
        <p className="text-xs opacity-60 mt-1">{getMessage()}</p>
      </div>
      
      {/* Badges */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {badgesList.map(b => {
            const earned = earnedBadges[b.condition as keyof typeof earnedBadges]
            return (
              <div 
                key={b.name}
                className={`card text-center px-3 py-2 ${earned ? '' : 'opacity-40 grayscale'}`}
                title={b.name}
              >
                <div className="text-2xl">{b.icon}</div>
                <div className="text-xs text-gray-500 mt-1">{b.name}</div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Rewards */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Récompenses</h2>
        <div className="space-y-3">
          {rewards.map(r => (
            <div key={r.id} className="card flex items-center gap-4">
              <div className="text-3xl">{r.icon}</div>
              <div className="flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-indigo-600 font-bold">{r.cost} pts</p>
              </div>
              <button 
                className={`btn ${userPoints >= r.cost ? 'btn-primary' : 'bg-gray-100 text-gray-400'}`}
                disabled={userPoints < r.cost}
              >
                {userPoints >= r.cost ? 'Réclamer' : 'Bientôt'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
