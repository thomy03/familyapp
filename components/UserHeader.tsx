'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type UserData = {
  points: number
  familyName: string | null
  avatar: string | null
}

export function UserHeader() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<UserData>({ points: 0, familyName: null, avatar: null })

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserData({
              points: data.user.points || 0,
              familyName: data.user.family?.name || null,
              avatar: data.user.avatar || null,
            })
          }
        })
        .catch(() => {})
    }
  }, [session])

  const defaultAvatar = '👨'

  return (
    <header className="glass border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-500/25">
            🌊
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">FamilyFlow</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">
              {userData.familyName ? `Famille ${userData.familyName}` : 'Mon espace'}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-orange-500/25">
            <span>⭐</span>
            <span>{userData.points}</span>
          </div>
          <Link href="/profile">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer">
              {userData.avatar || defaultAvatar}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
