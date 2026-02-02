'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Member = {
  id: string
  name: string | null
  email: string
  role: string
  points: number
  avatar: string | null
}

type FamilyData = {
  id: string
  name: string
  inviteCode: string
  members: Member[]
}

type CompletedTask = {
  id: string
  title: string
  points: number
  completedAt: string
}

type MemberStats = {
  totalCompleted: number
}

export default function FamilyPage() {
  const { data: session } = useSession()
  const [family, setFamily] = useState<FamilyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberTasks, setMemberTasks] = useState<CompletedTask[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchFamily()
    }
  }, [session])

  // Fetch member tasks when selected
  useEffect(() => {
    if (selectedMember) {
      fetchMemberTasks(selectedMember.id)
    } else {
      setMemberTasks([])
      setMemberStats(null)
    }
  }, [selectedMember])

  const fetchFamily = async () => {
    try {
      const res = await fetch('/api/family/me')
      if (res.ok) {
        const data = await res.json()
        setFamily(data.family)
      }
    } catch (err) {
      console.error('Error fetching family:', err)
    }
    setLoading(false)
  }

  const fetchMemberTasks = async (memberId: string) => {
    setLoadingTasks(true)
    try {
      const res = await fetch(`/api/members/${memberId}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setMemberTasks(data.tasks || [])
        setMemberStats(data.stats || null)
      }
    } catch (err) {
      console.error('Error fetching member tasks:', err)
    }
    setLoadingTasks(false)
  }

  const copyCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = () => {
    if (family?.inviteCode) {
      const url = `${window.location.origin}/onboarding?code=${family.inviteCode}`
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const shareLink = async () => {
    if (family?.inviteCode && navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins la famille ${family.name} sur FamilyFlow!`,
          text: `Utilise ce code pour rejoindre: ${family.inviteCode}`,
          url: `${window.location.origin}/onboarding?code=${family.inviteCode}`
        })
      } catch (err) {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getAvatar = (member: Member) => member.avatar || '👤'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="space-y-5">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pas encore de famille</h2>
          <p className="text-gray-500 mb-6">Crée ta famille ou rejoins-en une existante</p>
          <a href="/onboarding" className="btn btn-primary inline-block px-6 py-3">
            Commencer →
          </a>
        </div>
      </div>
    )
  }

  const leader = [...family.members].sort((a, b) => b.points - a.points)[0]

  return (
    <div className="space-y-5">
      {/* Family Invite Code Card */}
      <div className="card bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-xs text-white/70 uppercase tracking-wider">Code famille</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-2xl font-mono font-bold tracking-widest">{family.inviteCode}</p>
            <button 
              onClick={copyCode}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-xs text-white/60 mt-2">Partage ce code pour inviter des membres</p>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={copyLink}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 px-3 text-sm font-medium transition-colors"
            >
              {copiedLink ? '✓ Copié!' : '🔗 Copier le lien'}
            </button>
            <button 
              onClick={shareLink}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 px-3 text-sm font-medium transition-colors"
            >
              📤 Partager
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard mini */}
      {leader && (
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👑</div>
            <div className="flex-1">
              <p className="text-xs text-amber-600 font-medium">Leader de la semaine</p>
              <p className="font-bold text-gray-800">{leader.name || leader.email.split('@')[0]} · {leader.points} pts</p>
            </div>
            <div className="text-2xl">{getAvatar(leader)}</div>
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Membres ({family.members.length})
        </h2>
        <div className="space-y-2">
          {family.members.map((member, i) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="w-full card card-interactive flex items-center gap-4 text-left animate-slideUp"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl">
                  {getAvatar(member)}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{member.name || member.email.split('@')[0]}</p>
                <p className="text-xs text-gray-400">{member.role} · {member.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{member.points}</p>
                <p className="text-[10px] text-gray-400">points</p>
              </div>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add member hint */}
      <div className="card border-2 border-dashed border-gray-200 text-center py-6">
        <p className="text-gray-500 text-sm">
          Partage le code <span className="font-mono font-bold text-indigo-600">{family.inviteCode}</span> pour inviter des membres
        </p>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelectedMember(null)}>
          <div 
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slideUp max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl">
                {getAvatar(selectedMember)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedMember.name || selectedMember.email.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-400">{selectedMember.role}</p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center py-3 bg-indigo-50">
                <p className="text-2xl font-bold text-indigo-600">{selectedMember.points}</p>
                <p className="text-[10px] text-gray-500">Points totaux</p>
              </div>
              <div className="card text-center py-3 bg-green-50">
                <p className="text-2xl font-bold text-green-600">{memberStats?.totalCompleted || 0}</p>
                <p className="text-[10px] text-gray-500">Tâches complétées</p>
              </div>
            </div>

            {/* Completed Tasks History */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Historique des tâches ✅
              </h4>
              
              {loadingTasks ? (
                <div className="text-center py-4 text-gray-400">Chargement...</div>
              ) : memberTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm">Aucune tâche complétée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberTasks.map(task => (
                    <div key={task.id} className="card bg-gray-50 flex items-center gap-3">
                      <div className="text-green-500">✓</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(task.completedAt)}</p>
                      </div>
                      {task.points > 0 && (
                        <div className="text-xs font-bold text-indigo-600">+{task.points} pts</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
