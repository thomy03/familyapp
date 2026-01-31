import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo */}
        <div className="text-6xl mb-4">🌊</div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          FamilyFlow
        </h1>
        
        <p className="text-gray-600 text-lg">
          La gestion de tâches familiale 
          <span className="text-indigo-600 font-medium"> fun </span> 
          et 
          <span className="text-purple-600 font-medium"> sans prise de tête</span>
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="card text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div>Tâches simples</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-1">🎮</div>
            <div>Points & Badges</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-1">👨‍👩‍👧</div>
            <div>Toute la famille</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-1">🤖</div>
            <div>Coach IA</div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Link 
            href="/api/auth/signin"
            className="btn btn-primary w-full block text-center text-lg py-3"
          >
            Commencer 🚀
          </Link>
          <p className="text-xs text-gray-400">
            Connexion avec Google
          </p>
        </div>
      </div>
    </main>
  )
}
