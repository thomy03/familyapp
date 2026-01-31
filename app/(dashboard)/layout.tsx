import Link from "next/link"
import { TasksProvider } from "@/lib/tasks-context"
import { UserHeader } from "@/components/UserHeader"
import { NotificationPrompt } from "@/components/NotificationPrompt"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TasksProvider>
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Header */}
        <UserHeader />

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 py-5">
          {children}
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 safe-area-pb">
          <div className="max-w-lg mx-auto flex justify-around py-1">
            <NavItem href="/dashboard" icon="✅" label="Tâches" />
            <NavItem href="/calendar" icon="📅" label="Calendrier" />
            <NavItem href="/family" icon="👨👩👧" label="Famille" />
            <NavItem href="/rewards" icon="🏆" label="Rewards" />
          </div>
        </nav>

        {/* Notification Prompt */}
        <NotificationPrompt />
      </div>
    </TasksProvider>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center py-2 px-4 rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
