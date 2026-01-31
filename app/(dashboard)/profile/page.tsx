'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const AVATAR_OPTIONS = [
  // Adultes
  { emoji: '👨', label: 'Homme' },
  { emoji: '👩', label: 'Femme' },
  { emoji: '🧑', label: 'Personne' },
  { emoji: '👨‍🦱', label: 'Homme cheveux bouclés' },
  { emoji: '👩‍🦱', label: 'Femme cheveux bouclés' },
  { emoji: '👨‍🦰', label: 'Homme roux' },
  { emoji: '👩‍🦰', label: 'Femme rousse' },
  { emoji: '👱‍♂️', label: 'Homme blond' },
  { emoji: '👱‍♀️', label: 'Femme blonde' },
  { emoji: '👴', label: 'Grand-père' },
  { emoji: '👵', label: 'Grand-mère' },
  // Enfants
  { emoji: '👦', label: 'Garçon' },
  { emoji: '👧', label: 'Fille' },
  { emoji: '🧒', label: 'Enfant' },
  { emoji: '👶', label: 'Bébé' },
  // Fun
  { emoji: '🦸‍♂️', label: 'Super-héros' },
  { emoji: '🦸‍♀️', label: 'Super-héroïne' },
  { emoji: '🧙‍♂️', label: 'Magicien' },
  { emoji: '🧙‍♀️', label: 'Magicienne' },
  { emoji: '🤴', label: 'Prince' },
  { emoji: '👸', label: 'Princesse' },
  { emoji: '🤖', label: 'Robot' },
  { emoji: '👽', label: 'Alien' },
  { emoji: '🦊', label: 'Renard' },
  { emoji: '🐱', label: 'Chat' },
  { emoji: '🐶', label: 'Chien' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐻', label: 'Ours' },
  { emoji: '🐼', label: 'Panda' },
]

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('👨')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.user) {
        setName(data.user.name || '')
        setAvatar(data.user.avatar || '👨')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      })
      
      if (res.ok) {
        setMessage('✅ Profil mis à jour !')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('❌ Erreur lors de la sauvegarde')
      }
    } catch (err) {
      setMessage('❌ Erreur réseau')
    }
    
    setIsSaving(false)
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-3">{avatar}</div>
        <h1 className="text-2xl font-bold text-gray-800">{name || 'Mon profil'}</h1>
        <p className="text-gray-500 text-sm">{session?.user?.email}</p>
      </div>

      {/* Message de confirmation */}
      {message && (
        <div className={`text-center p-3 rounded-xl ${message.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      {/* Nom */}
      <div className="card">
        <label className="text-sm font-medium text-gray-700 block mb-2">Prénom / Surnom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Comment tu t'appelles ?"
        />
      </div>

      {/* Sélection d'avatar */}
      <div className="card">
        <label className="text-sm font-medium text-gray-700 block mb-3">Choisis ton avatar</label>
        
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.emoji}
              onClick={() => setAvatar(option.emoji)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                avatar === option.emoji
                  ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              title={option.label}
            >
              {option.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn btn-primary w-full py-3 text-lg"
      >
        {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
      </button>

      {/* Déconnexion */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full text-center text-red-500 hover:text-red-600 py-2"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}
