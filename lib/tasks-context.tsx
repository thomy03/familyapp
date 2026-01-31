'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export type Task = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string | null // HH:MM (optional, for appointments)
  points: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  difficulty: string
  duration: string
  status: 'PENDING' | 'COMPLETED'
  assigneeId: string | null
  assignee?: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  } | null
  createdAt: string
}

type TasksContextType = {
  tasks: Task[]
  isLoading: boolean
  addTask: (task: {
    title: string
    date: string
    time?: string
    points: number
    priority: string
    difficulty: string
    duration: string
    assigneeId: string
  }) => Promise<void>
  completeTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  refreshTasks: () => Promise<void>
  getTasksForDate: (date: string) => Task[]
  getPendingTasks: () => Task[]
}

const TasksContext = createContext<TasksContextType | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks from API
  const refreshTasks = useCallback(async () => {
    if (!session?.user) {
      setTasks([])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
    setIsLoading(false)
  }, [session])

  // Load tasks on mount and when session changes
  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

  const addTask = async (taskData: {
    title: string
    date: string
    time?: string
    points: number
    priority: string
    difficulty: string
    duration: string
    assigneeId: string
  }) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, data.task])
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const completeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, status: 'COMPLETED' as const } : t
        ))
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter(t => t.date === date && t.status === 'PENDING')
  }

  const getPendingTasks = () => {
    return tasks.filter(t => t.status === 'PENDING')
  }

  return (
    <TasksContext.Provider value={{ 
      tasks,
      isLoading,
      addTask, 
      completeTask,
      deleteTask,
      refreshTasks,
      getTasksForDate,
      getPendingTasks,
    }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider')
  }
  return context
}
