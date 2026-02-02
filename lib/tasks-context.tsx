"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useSession } from "next-auth/react"

export type Assignee = {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

export type Task = {
  id: string
  title: string
  date: string
  time?: string | null
  points: number
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  difficulty: string
  duration: string
  status: "PENDING" | "COMPLETED"
  assignees: Assignee[]
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
    assigneeIds: string[]
  }) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<{ date: string; time: string | null; title: string }>) => Promise<void>
  updateTaskAssignees: (id: string, assigneeIds: string[]) => Promise<void>
  refreshTasks: () => Promise<void>
  getTasksForDate: (date: string) => Task[]
  getPendingTasks: () => Task[]
}

const TasksContext = createContext<TasksContextType | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshTasks = useCallback(async () => {
    if (!session?.user) {
      setTasks([])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
    setIsLoading(false)
  }, [session])

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
    assigneeIds: string[]
  }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })
      
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, data.task])
      }
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const completeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, status: "COMPLETED" as const } : t
        ))
      }
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const uncompleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING" }),
      })
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, status: "PENDING" as const, completedAt: null } : t
        ))
      }
    } catch (error) {
      console.error("Error uncompleting task:", error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const updateTask = async (id: string, updates: Partial<{ date: string; time: string | null; title: string }>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, ...data.task } : t
        ))
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const updateTaskAssignees = async (id: string, assigneeIds: string[]) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => prev.map(t => 
          t.id === id ? data.task : t
        ))
      }
    } catch (error) {
      console.error("Error updating assignees:", error)
    }
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter(t => t.date === date)
  }

  const getPendingTasks = () => {
    return tasks.filter(t => t.status === "PENDING")
  }

  return (
    <TasksContext.Provider value={{ 
      tasks,
      isLoading,
      addTask, 
      completeTask,
      uncompleteTask,
      deleteTask,
      updateTask,
      updateTaskAssignees,
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
    throw new Error("useTasks must be used within TasksProvider")
  }
  return context
}
