'use client'

import { useEffect, useRef, useState } from 'react'
import { initialKanbanTasks } from '../constants'
import { applyTaskPatch, getNextTaskPosition } from '../domain/taskRules'
import {
  deleteTaskRow,
  insertTaskRow,
  loadTaskRows,
  seedTaskRows,
  subscribeToTasks,
  updateTaskRow,
} from '../services/taskService'
import type { KanbanColumnKey, KanbanTask } from '../types'
import { mapTaskRow } from '../utils'

type UseKanbanTasksOptions = {
  roomId: string
  joined: boolean
  sessionId: string
  ownerName: string
}

export function useKanbanTasks({ roomId, joined, sessionId, ownerName }: UseKanbanTasksOptions) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialKanbanTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskNotice, setTaskNotice] = useState('')
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnKey | null>(null)
  const saveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!joined || !roomId) return

    let cancelled = false

    async function loadTasks() {
      try {
        const rows = await loadTaskRows(roomId)
        const sourceRows = rows.length === 0
          ? await seedTaskRows(roomId, sessionId, initialKanbanTasks)
          : rows

        if (cancelled) return
        const nextTasks = sourceRows.map(mapTaskRow)
        setTasks(nextTasks)
        setSelectedTaskId((current) => nextTasks.some((task) => task.id === current) ? current : null)
        setTaskNotice('')
      } catch (error) {
        console.error('Load tasks error:', error)
        if (!cancelled) setTaskNotice('태스크를 불러오지 못했어요')
      }
    }

    void loadTasks()

    return () => {
      cancelled = true
    }
  }, [joined, roomId, sessionId])

  useEffect(() => {
    if (!joined || !roomId) return

    return subscribeToTasks(roomId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const nextTask = mapTaskRow(payload.new)
        setTasks((prev) => prev.some((task) => task.id === nextTask.id) ? prev : [...prev, nextTask])
        return
      }

      if (payload.eventType === 'UPDATE' && payload.new) {
        const nextTask = mapTaskRow(payload.new)
        setTasks((prev) => prev.map((task) => {
          if (task.id !== nextTask.id) return task
          if (saveTimersRef.current[task.id]) return task
          return nextTask
        }))
        return
      }

      if (payload.eventType === 'DELETE' && payload.old) {
        setTasks((prev) => prev.filter((task) => task.id !== payload.old?.id))
        setSelectedTaskId((current) => current === payload.old?.id ? null : current)
      }
    })
  }, [joined, roomId])

  useEffect(() => {
    const timers = saveTimersRef.current
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const selectedTask = selectedTaskId == null
    ? null
    : (tasks.find((task) => task.id === selectedTaskId) ?? null)

  async function persistTask(taskId: number, task: KanbanTask) {
    try {
      await updateTaskRow(roomId, taskId, task)
      setTaskNotice('모든 변경사항이 저장됐어요')
      setTimeout(() => {
        setTaskNotice((current) => current === '모든 변경사항이 저장됐어요' ? '' : current)
      }, 2000)
    } catch (error) {
      console.error('Update task error:', error)
      setTaskNotice('저장에 실패했어요')
    }
  }

  function queueTaskSave(taskId: number, nextTask: KanbanTask, delay = 180) {
    if (saveTimersRef.current[taskId]) clearTimeout(saveTimersRef.current[taskId])

    setTaskNotice('자동 저장 중...')
    saveTimersRef.current[taskId] = setTimeout(() => {
      delete saveTimersRef.current[taskId]
      void persistTask(taskId, nextTask)
    }, delay)
  }

  function updateTask(taskId: number, patch: Partial<KanbanTask>, options?: { immediate?: boolean }) {
    const currentTask = tasks.find((task) => task.id === taskId)
    if (!currentTask) return

    const nextTask = applyTaskPatch(currentTask, patch)

    setTasks((prev) => prev.map((task) => task.id === taskId ? nextTask : task))

    if (options?.immediate) {
      if (saveTimersRef.current[taskId]) {
        clearTimeout(saveTimersRef.current[taskId])
        delete saveTimersRef.current[taskId]
      }
      setTaskNotice('자동 저장 중...')
      void persistTask(taskId, nextTask)
      return
    }

    queueTaskSave(taskId, nextTask)
  }

  async function addTask(status: KanbanColumnKey) {
    const position = getNextTaskPosition(tasks, status)
    setTaskNotice('태스크를 만드는 중...')

    try {
      const row = await insertTaskRow({
        roomId,
        status,
        position,
        ownerName: ownerName.trim() || '나',
        sessionId,
      })
      const nextTask = mapTaskRow(row)
      setTasks((prev) => [...prev, nextTask])
      setSelectedTaskId(nextTask.id)
      setTaskNotice('새 태스크가 저장됐어요')
      setTimeout(() => {
        setTaskNotice((current) => current === '새 태스크가 저장됐어요' ? '' : current)
      }, 2000)
    } catch (error) {
      console.error('Add task error:', error)
      setTaskNotice('태스크 생성에 실패했어요')
    }
  }

  async function deleteTask(taskId: number) {
    if (saveTimersRef.current[taskId]) {
      clearTimeout(saveTimersRef.current[taskId])
      delete saveTimersRef.current[taskId]
    }

    setTaskNotice('태스크를 삭제하는 중...')

    try {
      await deleteTaskRow(roomId, taskId)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setSelectedTaskId(null)
      setTaskNotice('태스크가 삭제됐어요')
      setTimeout(() => {
        setTaskNotice((current) => current === '태스크가 삭제됐어요' ? '' : current)
      }, 2000)
    } catch (error) {
      console.error('Delete task error:', error)
      setTaskNotice('태스크 삭제에 실패했어요')
    }
  }

  return {
    tasks,
    selectedTask,
    selectedTaskId,
    taskNotice,
    draggingTaskId,
    dragOverColumn,
    setSelectedTaskId,
    setDraggingTaskId,
    setDragOverColumn,
    updateTask,
    addTask,
    deleteTask,
  }
}
