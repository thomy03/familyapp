'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const userId = session?.user?.id

  const handleCreate = async () => {
    if (!familyName.trim()) return
    
    // If not logged in, redirect to login first
    if (!userId) {
      localStorage.setItem('pendingFamily', familyName)
      router.push('/login?redirect=/onboarding')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName, userId }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setCreatedCode(data.family.inviteCode)
    } catch (err: any) {
      setError(err.message || 'Erreur')
    }
    setIsLoading(false)
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    
    if (!userId) {
      localStorage.setItem('pendingJoinCode', inviteCode)
      router.push('/login?redirect=/onboarding')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, userId }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Code invalide')
    }
    setIsLoading(false)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    const url = window.location.origin + '/onboarding?code=' + createdCode
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      setInviteCode(code)
      setMode('join')
    }
    // Check for pending actions from before login
    const pendingFamily = localStorage.getItem('pendingFamily')
    if (pendingFamily && userId) {
      setFamilyName(pendingFamily)
      localStorage.removeItem('pendingFamily')
      setMode('create')
    }
    const pendingCode = localStorage.getItem('pendingJoinCode')
    if (pendingCode && userId) {
      setInviteCode(pendingCode)
      localStorage.removeItem('pendingJoinCode')
      setMode('join')
    }
  }, [userId])

  const userName = session?.user?.name?.split(' ')[0] || ''

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="card max-w-sm w-full space-y-6">
        {mode === 'choose' && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-3">👨‍👩‍👧</div>
              <h1 className="text-2xl font-bold text-gray-800">
                {userName ? `Bienvenue ${userName} !` : 'Bienvenue !'}
              </h1>
              <p className="text-gray-500 text-sm mt-2">Crée ta famille ou rejoins-en une</p>
              {status === 'unauthenticated' && (
                <p className="text-xs text-amber-600 mt-2">
                  Tu devras te connecter pour continuer
                </p>
              )}
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full card card-interactive bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🏠</span>
                <div className="text-left">
                  <p className="font-semibold">Créer ma famille</p>
                  <p className="text-sm opacity-80">Je suis le premier</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full card card-interactive border-2 border-indigo-200 hover:border-indigo-400"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🔗</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Rejoindre une famille</p>
                  <p className="text-sm text-gray-500">J'ai un code d'invitation</p>
                </div>
              </div>
            </button>
          </>
        )}

        {mode === 'create' && !createdCode && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-3">🏠</div>
              <h1 className="text-2xl font-bold text-gray-800">Créer ta famille</h1>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Nom de la famille</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Kadouch, Dupont..."
              />
            </div>

            <button onClick={handleCreate} disabled={isLoading || !familyName.trim()} className="btn btn-primary w-full py-3">
              {isLoading ? 'Création...' : (userId ? 'Créer ma famille' : 'Continuer →')}
            </button>

            <button onClick={() => setMode('choose')} className="text-sm text-gray-500 w-full">← Retour</button>
          </>
        )}

        {mode === 'create' && createdCode && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold text-gray-800">Famille créée !</h1>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white text-center">
              <p className="text-sm opacity-80">Code d'invitation</p>
              <p className="text-2xl font-mono font-bold tracking-wider mt-1">{createdCode}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyCode} className="card border-2 border-dashed border-gray-200 text-gray-600 text-sm">
                📋 {copied ? 'Copié !' : 'Copier code'}
              </button>
              <button onClick={copyLink} className="card border-2 border-dashed border-gray-200 text-gray-600 text-sm">
                🔗 Copier lien
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Partage ce code ou lien avec ta famille pour qu'ils te rejoignent !
            </p>

            <button onClick={() => router.push('/dashboard')} className="btn btn-primary w-full py-3">
              Aller au dashboard →
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-3">🔗</div>
              <h1 className="text-2xl font-bold text-gray-800">Rejoindre une famille</h1>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Code d'invitation</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="XXXX-XXXX"
              />
            </div>

            <button onClick={handleJoin} disabled={isLoading || !inviteCode.trim()} className="btn btn-primary w-full py-3">
              {isLoading ? 'Connexion...' : (userId ? 'Rejoindre' : 'Continuer →')}
            </button>

            <button onClick={() => setMode('choose')} className="text-sm text-gray-500 w-full">← Retour</button>
          </>
        )}
      </div>
    </main>
  )
}
