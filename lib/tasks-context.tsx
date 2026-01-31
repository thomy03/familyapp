'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Task = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  deadline?: Date
  points: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  difficulty: 'easy' | 'normal' | 'hard' | 'epic'
  duration: string
  status: 'PENDING' | 'COMPLETED'
  assigneeId: string
  assigneeName: string
  createdAt: Date
}

type TasksContextType = {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void
  completeTask: (id: string) => void
  getTasksForDate: (date: string) => Task[]
  getTasksForUser: (userId: string) => Task[]
  getPendingTasks: () => Task[]
  clearAllTasks: () => void
}

const TasksContext = createContext<TasksContextType | null>(null)

// Demo task IDs to detect and remove
const DEMO_TASK_IDS = ['1', '2', '3']

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('familyflow-tasks')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Check if this is demo data - if any task has demo IDs, clear everything
        const hasDemoData = parsed.some((t: any) => DEMO_TASK_IDS.includes(t.id))
        if (hasDemoData) {
          console.log('Clearing demo data...')
          localStorage.removeItem('familyflow-tasks')
          setTasks([])
        } else {
          setTasks(parsed.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            deadline: t.deadline ? new Date(t.deadline) : undefined,
          })))
        }
      } catch {
        setTasks([])
      }
    } else {
      setTasks([])
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('familyflow-tasks', JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      status: 'PENDING',
      createdAt: new Date(),
    }
    setTasks(prev => [...prev, newTask])
  }

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'COMPLETED' as const } : t
    ))
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter(t => t.date === date && t.status === 'PENDING')
  }

  const getTasksForUser = (userId: string) => {
    return tasks.filter(t => t.assigneeId === userId)
  }

  const getPendingTasks = () => {
    return tasks.filter(t => t.status === 'PENDING')
  }

  const clearAllTasks = () => {
    setTasks([])
    localStorage.removeItem('familyflow-tasks')
  }

  if (!isLoaded) {
    return null
  }

  return (
    <TasksContext.Provider value={{ 
      tasks, 
      addTask, 
      completeTask, 
      getTasksForDate, 
      getTasksForUser,
      getPendingTasks,
      clearAllTasks
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
