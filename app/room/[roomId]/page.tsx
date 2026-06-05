'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { getSessionId, getSavedName, saveName } from '@/lib/session'
import { DocumentsView } from './features/documents/components/DocumentsView'
import { NotificationsView } from './features/notifications/components/NotificationsView'
import { GlobalStyles } from './features/room/components/GlobalStyles'
import { NavIcon } from './features/room/components/NavIcon'
import { TodoView } from './features/todos/components/TodoView'
import {
  docsData,
  initialDashboardLinks,
  initialKanbanTasks,
  initialProjectGoal,
  initialProjectName,
  initialProjectSummary,
  initialTeamRoles,
  initialTodos,
  kanbanColumns,
  notifications,
  pageTitles,
  SHELL_BACKGROUND_STORAGE_KEY,
  shellBackgroundLabels,
} from './features/room/constants'
import type {
  DashboardLink,
  DashboardLinkRow,
  DashboardMetaRow,
  KanbanColumnKey,
  KanbanTask,
  Message,
  PageKey,
  ShellBackgroundKey,
  TaskRow,
  TeamRole,
  TeamRoleRow,
  TodoItem,
} from './features/room/types'
import {
  buildTaskInsert,
  buildTaskUpdate,
  formatDueLabel,
  formatSupabaseError,
  formatTime,
  getAvColor,
  getNextShellBackground,
  getShellBackgroundStyle,
  mapDashboardLinkRow,
  mapTaskRow,
  mapTeamRoleRow,
  toDateInputValue,
} from './features/room/utils'
import { ScheduleView } from './features/schedule/components/ScheduleView'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [shellBackground, setShellBackground] = useState<ShellBackgroundKey>(() => {
    if (typeof window === 'undefined') return 'default'
    const saved = window.localStorage.getItem(SHELL_BACKGROUND_STORAGE_KEY)
    return saved === 'rolophus' ? 'rolophus' : 'default'
  })
  const [name, setName] = useState(() => (typeof window === 'undefined' ? '' : getSavedName()))
  const [joined, setJoined] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(initialKanbanTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskNotice, setTaskNotice] = useState('')
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnKey | null>(null)
  const [projectName, setProjectName] = useState(initialProjectName)
  const [projectSummary, setProjectSummary] = useState(initialProjectSummary)
  const [projectGoal, setProjectGoal] = useState(initialProjectGoal)
  const [dashboardLinks, setDashboardLinks] = useState<DashboardLink[]>(initialDashboardLinks)
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [linkLabelInput, setLinkLabelInput] = useState('')
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkKindInput, setLinkKindInput] = useState<DashboardLink['kind']>('github')
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>(initialTeamRoles)
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [todoInput, setTodoInput] = useState('')
  const sessionId = getSessionId()
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const todoComposingRef = useRef(false)
  const taskSaveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const dashboardMetaSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const teamRoleSaveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const url = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    if (!joined || !roomId) return

    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          console.error('Load messages error:', error)
          return
        }
        setMessages(data || [])
      })

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe((status) => {
        console.log('Realtime:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [joined, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SHELL_BACKGROUND_STORAGE_KEY, shellBackground)
  }, [shellBackground])

  useEffect(() => {
    const timers = taskSaveTimersRef.current
    const teamRoleTimers = teamRoleSaveTimersRef.current
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer))
      Object.values(teamRoleTimers).forEach((timer) => clearTimeout(timer))
      if (dashboardMetaSaveTimerRef.current) clearTimeout(dashboardMetaSaveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!joined || !roomId) return

    let cancelled = false

    async function loadTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('room_id', roomId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Load tasks error:', error)
        if (!cancelled) setTaskNotice('태스크를 불러오지 못했어요')
        return
      }

      if (!data || data.length === 0) {
        const seedRows = initialKanbanTasks.map((task, index) => buildTaskInsert(task, roomId, sessionId, index))
        const { data: seeded, error: seedError } = await supabase
          .from('tasks')
          .insert(seedRows)
          .select('*')
          .order('position', { ascending: true })

        if (seedError) {
          console.error('Seed tasks error:', seedError)
          if (!cancelled) setTaskNotice('초기 태스크 생성에 실패했어요')
          return
        }

        if (!cancelled) {
          const nextTasks = (seeded as TaskRow[]).map(mapTaskRow)
          setKanbanTasks(nextTasks)
          setTaskNotice('')
        }
        return
      }

      if (!cancelled) {
        const nextTasks = (data as TaskRow[]).map(mapTaskRow)
        setKanbanTasks(nextTasks)
        setSelectedTaskId((current) => nextTasks.some((task) => task.id === current) ? current : null)
        setTaskNotice('')
      }
    }

    loadTasks()

    return () => {
      cancelled = true
    }
  }, [joined, roomId, sessionId])

  useEffect(() => {
    if (!joined || !roomId) return

    const channel = supabase
      .channel(`tasks-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nextTask = mapTaskRow(payload.new as TaskRow)
            setKanbanTasks((prev) => prev.some((task) => task.id === nextTask.id) ? prev : [...prev, nextTask])
            return
          }

          if (payload.eventType === 'UPDATE') {
            const nextTask = mapTaskRow(payload.new as TaskRow)
            setKanbanTasks((prev) => prev.map((task) => {
              if (task.id !== nextTask.id) return task
              // 현재 편집 중인 태스크(저장 대기 타이머가 있는)는 덮어쓰지 않음
              if (taskSaveTimersRef.current[task.id]) return task
              return nextTask
            }))
            return
          }

          if (payload.eventType === 'DELETE') {
            const deletedTask = payload.old as TaskRow
            setKanbanTasks((prev) => prev.filter((task) => task.id !== deletedTask.id))
            setSelectedTaskId((current) => current === deletedTask.id ? null : current)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [joined, roomId])

  useEffect(() => {
    if (!joined || !roomId) return

    let cancelled = false

    async function loadDashboard() {
      const [{ data: meta, error: metaError }, { data: links, error: linksError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from('room_dashboard').select('*').eq('room_id', roomId).maybeSingle(),
        supabase.from('dashboard_links').select('*').eq('room_id', roomId).order('position', { ascending: true }),
        supabase.from('team_roles').select('*').eq('room_id', roomId).order('position', { ascending: true }),
      ])

      if (metaError || linksError || rolesError) {
        console.error('Load dashboard error:', {
          metaError: formatSupabaseError(metaError),
          linksError: formatSupabaseError(linksError),
          rolesError: formatSupabaseError(rolesError),
        })
        if (!cancelled) setDashboardNotice('대시보드를 불러오지 못했어요')
        return
      }

      if (!meta) {
        const { data: seededMeta, error: seedMetaError } = await supabase
          .from('room_dashboard')
          .upsert({
            room_id: roomId,
            project_name: initialProjectName,
            summary: initialProjectSummary,
            goal: initialProjectGoal,
          }, { onConflict: 'room_id' })
          .select('*')
          .single()

        if (seedMetaError) {
          console.error('Seed room_dashboard error:', formatSupabaseError(seedMetaError))
          if (!cancelled) setDashboardNotice('대시보드 초기화에 실패했어요')
          return
        }

        if (!cancelled && seededMeta) {
          setProjectName(seededMeta.project_name || initialProjectName)
          setProjectSummary(seededMeta.summary)
          setProjectGoal(seededMeta.goal)
        }
      } else if (!cancelled) {
        setProjectName(meta.project_name || initialProjectName)
        setProjectSummary(meta.summary)
        setProjectGoal(meta.goal)
      }

      if ((!links || links.length === 0) && !cancelled) {
        const seedLinks = initialDashboardLinks.map((link, index) => ({
          room_id: roomId,
          label: link.label,
          url: link.url,
          kind: link.kind,
          position: index,
        }))
        const { data: insertedLinks, error: seedLinksError } = await supabase.from('dashboard_links').insert(seedLinks).select('*').order('position', { ascending: true })
        if (seedLinksError) {
          console.error('Seed dashboard_links error:', formatSupabaseError(seedLinksError))
          setDashboardNotice('링크 초기화에 실패했어요')
          return
        }
        setDashboardLinks((insertedLinks as DashboardLinkRow[]).map(mapDashboardLinkRow))
      } else if (!cancelled && links) {
        setDashboardLinks((links as DashboardLinkRow[]).map(mapDashboardLinkRow))
      }

      if ((!roles || roles.length === 0) && !cancelled) {
        const seedRoles = initialTeamRoles.map((member, index) => ({
          room_id: roomId,
          name: member.name,
          role: member.role,
          position: index,
        }))
        const { data: insertedRoles, error: seedRolesError } = await supabase.from('team_roles').insert(seedRoles).select('*').order('position', { ascending: true })
        if (seedRolesError) {
          console.error('Seed team_roles error:', formatSupabaseError(seedRolesError))
          setDashboardNotice('팀원 역할 초기화에 실패했어요')
          return
        }
        setTeamRoles((insertedRoles as TeamRoleRow[]).map(mapTeamRoleRow))
      } else if (!cancelled && roles) {
        setTeamRoles((roles as TeamRoleRow[]).map(mapTeamRoleRow))
      }

      if (!cancelled) setDashboardNotice('')
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [joined, roomId])

  useEffect(() => {
    if (!joined || !roomId) return

    const dashboardChannel = supabase
      .channel(`dashboard-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_dashboard', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as DashboardMetaRow
            setProjectName(row.project_name || initialProjectName)
            setProjectSummary(row.summary)
            setProjectGoal(row.goal)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dashboard_links', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nextLink = mapDashboardLinkRow(payload.new as DashboardLinkRow)
            setDashboardLinks((prev) => prev.some((link) => link.id === nextLink.id) ? prev : [...prev, nextLink])
            return
          }
          if (payload.eventType === 'UPDATE') {
            const nextLink = mapDashboardLinkRow(payload.new as DashboardLinkRow)
            setDashboardLinks((prev) => prev.map((link) => link.id === nextLink.id ? nextLink : link))
            return
          }
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as DashboardLinkRow
            setDashboardLinks((prev) => prev.filter((link) => link.id !== oldRow.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_roles', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nextRole = mapTeamRoleRow(payload.new as TeamRoleRow)
            setTeamRoles((prev) => prev.some((member) => member.id === nextRole.id) ? prev : [...prev, nextRole])
            return
          }
          if (payload.eventType === 'UPDATE') {
            const nextRole = mapTeamRoleRow(payload.new as TeamRoleRow)
            setTeamRoles((prev) => prev.map((member) => member.id === nextRole.id ? nextRole : member))
            return
          }
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as TeamRoleRow
            setTeamRoles((prev) => prev.filter((member) => member.id !== oldRow.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(dashboardChannel)
    }
  }, [joined, roomId])

  async function join() {
    const trimmed = name.trim()
    if (!trimmed) return

    saveName(trimmed)
    const { error } = await supabase.from('members').upsert(
      {
        room_id: roomId,
        session_id: sessionId,
        display_name: trimmed,
      },
      { onConflict: 'room_id,session_id' }
    )

    if (error) {
      console.error('Join error:', error)
      return
    }

    setJoined(true)
  }

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed) return

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      session_id: sessionId,
      display_name: name.trim(),
      content: trimmed,
    })

    if (error) {
      console.error('Send message error:', error)
      return
    }

    setInput('')
  }

  function addTodo() {
    const trimmed = todoInput.trim()
    if (!trimmed) return
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, due: '미정' }])
    setTodoInput('')
  }

  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((item) => {
      if (item.id !== id) return item
      if (item.done) {
        return {
          ...item,
          done: false,
          due: item.text.includes('랜딩') ? '오늘 마감' : item.text.includes('팀 위클리') ? '오늘 오후 2시' : item.due === '완료' ? '미정' : item.due,
          urgent: item.text.includes('랜딩') || item.text.includes('팀 위클리'),
        }
      }
      return { ...item, done: true, due: '완료', urgent: false }
    }))
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  async function persistTask(taskId: number, task: KanbanTask) {
    const { data, error } = await supabase
      .from('tasks')
      .update(buildTaskUpdate(task))
      .eq('id', taskId)
      .eq('room_id', roomId)
      .select('id')

    if (error) {
      console.error('Update task error:', error)
      setTaskNotice('저장에 실패했어요')
      return
    }

    if (!data || data.length === 0) {
      console.error('Update task: no rows updated (RLS policy may be blocking updates for this table)')
      setTaskNotice('저장에 실패했어요 (권한 문제일 수 있어요)')
      return
    }

    setTaskNotice('모든 변경사항이 저장됐어요')
    setTimeout(() => {
      setTaskNotice((current) => current === '모든 변경사항이 저장됐어요' ? '' : current)
    }, 2000)
  }

  function queueTaskSave(taskId: number, nextTask: KanbanTask, delay = 180) {
    if (taskSaveTimersRef.current[taskId]) {
      clearTimeout(taskSaveTimersRef.current[taskId])
    }

    setTaskNotice('자동 저장 중...')
    taskSaveTimersRef.current[taskId] = setTimeout(() => {
      delete taskSaveTimersRef.current[taskId]
      void persistTask(taskId, nextTask)
    }, delay)
  }

  function updateTask(taskId: number, patch: Partial<KanbanTask>, options?: { immediate?: boolean }) {
    const currentTask = kanbanTasks.find((task) => task.id === taskId)
    if (!currentTask) return

    const nextTask: KanbanTask = { ...currentTask, ...patch }
    if (nextTask.status === 'done') {
      nextTask.due = '완료'
      nextTask.overdue = false
    }

    setKanbanTasks((prev) => prev.map((task) => task.id === taskId ? nextTask : task))

    if (options?.immediate) {
      if (taskSaveTimersRef.current[taskId]) {
        clearTimeout(taskSaveTimersRef.current[taskId])
        delete taskSaveTimersRef.current[taskId]
      }
      setTaskNotice('자동 저장 중...')
      void persistTask(taskId, nextTask)
      return
    }
    queueTaskSave(taskId, nextTask)
  }

  async function addKanbanTask(status: KanbanColumnKey) {
    const position = kanbanTasks.filter((task) => task.status === status).length

    setTaskNotice('태스크를 만드는 중...')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        room_id: roomId,
        title: '새 태스크',
        description: '',
        status,
        category: '기획',
        category_class: 'tag-p',
        owner_name: name.trim() || '나',
        due_text: '미정',
        is_overdue: false,
        position,
        created_by_session_id: sessionId,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Add task error:', error)
      setTaskNotice('태스크 생성에 실패했어요')
      return
    }

    const nextTask = mapTaskRow(data as TaskRow)
    setKanbanTasks((prev) => [...prev, nextTask])
    setSelectedTaskId(nextTask.id)
    setTaskNotice('새 태스크가 저장됐어요')
    setTimeout(() => {
      setTaskNotice((current) => current === '새 태스크가 저장됐어요' ? '' : current)
    }, 2000)
  }

  async function deleteTask(taskId: number) {
    if (taskSaveTimersRef.current[taskId]) {
      clearTimeout(taskSaveTimersRef.current[taskId])
      delete taskSaveTimersRef.current[taskId]
    }

    setTaskNotice('태스크를 삭제하는 중...')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('room_id', roomId)

    if (error) {
      console.error('Delete task error:', error)
      setTaskNotice('태스크 삭제에 실패했어요')
      return
    }

    setKanbanTasks((prev) => prev.filter((task) => task.id !== taskId))
    setSelectedTaskId(null)
    setTaskNotice('태스크가 삭제됐어요')
    setTimeout(() => {
      setTaskNotice((current) => current === '태스크가 삭제됐어요' ? '' : current)
    }, 2000)
  }

  function scheduleDashboardMetaSave(nextProjectName: string, nextSummary: string, nextGoal: string) {
    if (dashboardMetaSaveTimerRef.current) clearTimeout(dashboardMetaSaveTimerRef.current)
    setDashboardNotice('대시보드 자동 저장 중...')
    dashboardMetaSaveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('room_dashboard')
        .upsert({ room_id: roomId, project_name: nextProjectName, summary: nextSummary, goal: nextGoal }, { onConflict: 'room_id' })

      if (error) {
        console.error('Save room_dashboard error:', error)
        setDashboardNotice('대시보드 저장에 실패했어요')
        return
      }

      setDashboardNotice('대시보드가 저장됐어요')
      setTimeout(() => {
        setDashboardNotice((current) => current === '대시보드가 저장됐어요' ? '' : current)
      }, 2000)
    }, 450)
  }

  async function addDashboardLink() {
    const label = linkLabelInput.trim()
    const urlValue = linkUrlInput.trim()
    if (!label || !urlValue) return

    const normalizedUrl = /^https?:\/\//.test(urlValue) ? urlValue : `https://${urlValue}`
    const position = dashboardLinks.length
    setDashboardNotice('링크를 추가하는 중...')

    const { data, error } = await supabase
      .from('dashboard_links')
      .insert({
        room_id: roomId,
        label,
        url: normalizedUrl,
        kind: linkKindInput,
        position,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Add dashboard link error:', error)
      setDashboardNotice('링크 추가에 실패했어요')
      return
    }

    const nextLink = mapDashboardLinkRow(data as DashboardLinkRow)
    setDashboardLinks((prev) => [...prev, nextLink])
    setLinkLabelInput('')
    setLinkUrlInput('')
    setLinkKindInput('github')
    setDashboardNotice('링크가 저장됐어요')
  }

  async function removeDashboardLink(id: number) {
    const { error } = await supabase
      .from('dashboard_links')
      .delete()
      .eq('id', id)
      .eq('room_id', roomId)

    if (error) {
      console.error('Delete dashboard link error:', error)
      setDashboardNotice('링크 삭제에 실패했어요')
      return
    }

    setDashboardLinks((prev) => prev.filter((link) => link.id !== id))
  }

  async function persistTeamRole(role: TeamRole) {
    const { error } = await supabase
      .from('team_roles')
      .update({
        name: role.name,
        role: role.role,
      })
      .eq('id', role.id)
      .eq('room_id', roomId)

    if (error) {
      console.error('Update team role error:', error)
      setDashboardNotice('팀원 정보 저장에 실패했어요')
      return
    }

    setDashboardNotice('팀원 정보가 저장됐어요')
    setTimeout(() => {
      setDashboardNotice((current) => current === '팀원 정보가 저장됐어요' ? '' : current)
    }, 2000)
  }

  function updateTeamRole(id: number, patch: Partial<TeamRole>) {
    let nextRoleSnapshot: TeamRole | null = null

    setTeamRoles((prev) => prev.map((member) => {
      if (member.id !== id) return member
      const nextMember = { ...member, ...patch }
      nextRoleSnapshot = nextMember
      return nextMember
    }))

    if (!nextRoleSnapshot) return

    if (teamRoleSaveTimersRef.current[id]) clearTimeout(teamRoleSaveTimersRef.current[id])
    setDashboardNotice('팀원 정보 자동 저장 중...')
    teamRoleSaveTimersRef.current[id] = setTimeout(() => {
      delete teamRoleSaveTimersRef.current[id]
      void persistTeamRole(nextRoleSnapshot as TeamRole)
    }, 450)
  }

  async function addTeamRole() {
    const position = teamRoles.length
    const { data, error } = await supabase
      .from('team_roles')
      .insert({
        room_id: roomId,
        name: '새 팀원',
        role: 'Role',
        position,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Add team role error:', error)
      setDashboardNotice('팀원 추가에 실패했어요')
      return
    }

    setTeamRoles((prev) => [...prev, mapTeamRoleRow(data as TeamRoleRow)])
  }

  async function removeTeamRole(id: number) {
    if (teamRoleSaveTimersRef.current[id]) {
      clearTimeout(teamRoleSaveTimersRef.current[id])
      delete teamRoleSaveTimersRef.current[id]
    }

    const { error } = await supabase
      .from('team_roles')
      .delete()
      .eq('id', id)
      .eq('room_id', roomId)

    if (error) {
      console.error('Delete team role error:', error)
      setDashboardNotice('팀원 삭제에 실패했어요')
      return
    }

    setTeamRoles((prev) => prev.filter((member) => member.id !== id))
  }

  const selectedTask = selectedTaskId == null
    ? null
    : (kanbanTasks.find((task) => task.id === selectedTaskId) ?? null)

  if (!joined) {
    return (
      <>
        <div className="join-shell" style={getShellBackgroundStyle(shellBackground)}>
          <button
            className="shell-fab"
            onClick={() => setShellBackground(getNextShellBackground(shellBackground))}
            type="button"
            title={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
            aria-label={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
          >
            BG
          </button>
          <div className="join-card">
            <div className="join-badge">참여하기</div>
            <div className="logo join-logo">⬡</div>
            <h2 className="join-title">Pungto</h2>
            <p className="join-desc">이름만 입력하면 바로 시작해요</p>
            <input
              className="join-input"
              placeholder="이름 또는 닉네임"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !composingRef.current) join()
              }}
              autoFocus
            />
            <button className="join-btn" onClick={join}>입장</button>
            <p className="join-hint">이전 이름은 이 기기에서 자동으로 기억돼요</p>
          </div>
        </div>
        <GlobalStyles />
      </>
    )
  }

  return (
    <>
      <div className="page-shell" style={getShellBackgroundStyle(shellBackground)}>
        <button
          className="shell-fab"
          onClick={() => setShellBackground(getNextShellBackground(shellBackground))}
          type="button"
          title={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
          aria-label={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
        >
          BG
        </button>
        <div className="wrap">
          <aside className="sidebar">
            <div className="logo">⬡</div>
            {(['dashboard', 'chat', 'kanban', 'schedule', 'docs'] as PageKey[]).map((key) => (
              <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => setActivePage(key)} title={pageTitles[key]}>
                <NavIcon type={key} />
              </button>
            ))}
            <div className="nav-sep" />
            {(['notif', 'todo'] as PageKey[]).map((key) => (
              <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => setActivePage(key)} title={pageTitles[key]}>
                {key === 'notif' ? <div className="badge" /> : null}
                <NavIcon type={key} />
              </button>
            ))}
          </aside>

          <main className="main">
            <div className="topbar">
              <span className="page-title">{pageTitles[activePage]}</span>
              <div className="url-pill" onClick={() => setShowQR((prev) => !prev)}>
                <div className="green-dot" />
                <span>{`pungto.app/r/${roomId}`}</span>
              </div>
              <button className="btn-share" onClick={() => setShowQR((prev) => !prev)}>링크 공유</button>
            </div>

            {showQR && (
              <div className="share-panel">
                <QRCodeSVG value={url} size={72} />
                <div className="share-info">
                  <p className="share-label">QR 또는 링크로 초대하세요</p>
                  <p className="share-url">{url}</p>
                  <button className="copy-btn" onClick={copyLink}>{copied ? '복사됨!' : '링크 복사'}</button>
                </div>
              </div>
            )}

            <div className="content">
              {activePage === 'dashboard' && (
                <div className="page active dashboard-page">
                  <div className="dashboard-grid">
                    <section className="dash-card dash-hero">
                      <div className="dash-card-head">
                        <div>
                          <p className="dash-eyebrow">Project Overview</p>
                          {dashboardNotice ? <p className="dash-notice">{dashboardNotice}</p> : null}
                        </div>
                        <div className="dash-room-chip">Room {roomId}</div>
                      </div>
                      <label className="dash-field">
                        <span>프로젝트명</span>
                        <input
                          className="dash-input dash-project-name"
                          value={projectName}
                          onChange={(e) => {
                            const nextValue = e.target.value
                            setProjectName(nextValue)
                            scheduleDashboardMetaSave(nextValue, projectSummary, projectGoal)
                          }}
                        />
                      </label>
                      <label className="dash-field">
                        <span>프로젝트 설명</span>
                        <textarea
                          className="dash-textarea"
                          value={projectSummary}
                          onChange={(e) => {
                            const nextValue = e.target.value
                            setProjectSummary(nextValue)
                            scheduleDashboardMetaSave(projectName, nextValue, projectGoal)
                          }}
                        />
                      </label>
                      <label className="dash-field">
                        <span>현재 목표</span>
                        <textarea
                          className="dash-textarea compact"
                          value={projectGoal}
                          onChange={(e) => {
                            const nextValue = e.target.value
                            setProjectGoal(nextValue)
                            scheduleDashboardMetaSave(projectName, projectSummary, nextValue)
                          }}
                        />
                      </label>
                    </section>

                    <section className="dash-card">
                      <div className="dash-card-head">
                        <div>
                          <p className="dash-eyebrow">Quick Links</p>
                          <h3 className="dash-title">참고 링크</h3>
                        </div>
                      </div>
                      <div className="dash-link-form">
                        <select className="dash-input" value={linkKindInput} onChange={(e) => setLinkKindInput(e.target.value as DashboardLink['kind'])}>
                          <option value="github">GitHub</option>
                          <option value="figma">Figma</option>
                          <option value="notion">Notion</option>
                          <option value="docs">Docs</option>
                          <option value="etc">기타</option>
                        </select>
                        <input
                          className="dash-input"
                          placeholder="링크 이름"
                          value={linkLabelInput}
                          onChange={(e) => setLinkLabelInput(e.target.value)}
                        />
                        <input
                          className="dash-input link-url"
                          placeholder="https://..."
                          value={linkUrlInput}
                          onChange={(e) => setLinkUrlInput(e.target.value)}
                        />
                        <button className="dash-primary-btn" type="button" onClick={addDashboardLink}>링크 추가</button>
                      </div>
                      <div className="dash-link-list">
                        {dashboardLinks.map((link) => (
                          <div className="dash-link-item" key={link.id}>
                            <div className={`dash-link-icon kind-${link.kind}`}>{link.kind.slice(0, 1).toUpperCase()}</div>
                            <div className="dash-link-copy">
                              <div className="dash-link-label">{link.label}</div>
                              <a className="dash-link-url" href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                            </div>
                            <button className="dash-ghost-btn" type="button" onClick={() => removeDashboardLink(link.id)}>삭제</button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="dash-card">
                      <div className="dash-card-head">
                        <div>
                          <p className="dash-eyebrow">Team Roles</p>
                          <h3 className="dash-title">팀원 역할</h3>
                        </div>
                        <button className="dash-primary-btn" type="button" onClick={addTeamRole}>팀원 추가</button>
                      </div>
                      <div className="team-role-list">
                        <div className="team-role-head">
                          <span>이름</span>
                          <span>역할</span>
                          <span>관리</span>
                        </div>
                        {teamRoles.map((member) => (
                          <div className="team-role-card" key={member.id}>
                            <input
                              className="dash-input team-name compact"
                              value={member.name}
                              onChange={(e) => updateTeamRole(member.id, { name: e.target.value })}
                            />
                            <input
                              className="dash-input compact"
                              value={member.role}
                              onChange={(e) => updateTeamRole(member.id, { role: e.target.value })}
                            />
                            <button className="dash-ghost-btn compact-btn" type="button" onClick={() => removeTeamRole(member.id)}>삭제</button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activePage === 'chat' && (
                <div className="page active chat-page">
                  <div className="chat-messages" ref={chatScrollRef}>
                    {messages.length === 0 && <p className="empty-chat">아직 메시지가 없어요. 첫 메시지를 보내보세요!</p>}
                    {messages.map((msg) => {
                      const isMe = msg.session_id === sessionId
                      const safeName = msg.display_name?.trim() || '익명'
                      return (
                        <div key={msg.id} className={`msg${isMe ? ' me' : ''}`}>
                          <div className={`av ${getAvColor(safeName)}`}>{safeName[0]}</div>
                          <div className="bubble-wrap">
                            {!isMe && <span className="sender-name">{safeName}</span>}
                            <div className="bubble">{msg.content}</div>
                            <div className="msg-meta">{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <div className="chat-input-row sticky-input">
                    <input
                      className="chat-input"
                      placeholder="메시지를 입력하세요..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onCompositionStart={() => { composingRef.current = true }}
                      onCompositionEnd={() => { composingRef.current = false }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !composingRef.current) sendMessage()
                      }}
                      autoComplete="off"
                    />
                    <button className="send-btn" onClick={sendMessage}>
                      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {activePage === 'kanban' && (
                <div className="page active">
                  <div className="kanban">
                    {kanbanColumns.map((column) => {
                      const tasks = kanbanTasks.filter((task) => task.status === column.key)
                      const isOver = dragOverColumn === column.key && draggingTaskId !== null
                      return (
                        <div
                          className={`k-col${isOver ? ' drag-over' : ''}`}
                          key={column.key}
                          onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column.key) }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDragOverColumn(null)
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggingTaskId !== null) {
                              const draggingTask = kanbanTasks.find((t) => t.id === draggingTaskId)
                              if (draggingTask && draggingTask.status !== column.key) {
                                updateTask(draggingTaskId, { status: column.key }, { immediate: true })
                              }
                            }
                            setDraggingTaskId(null)
                            setDragOverColumn(null)
                          }}
                        >
                          <div className="k-col-title">{column.label} <span className="k-count">{tasks.length}</span></div>
                          {tasks.map((task) => (
                            <button
                              className={`k-card${selectedTaskId === task.id ? ' selected' : ''}${task.status === 'done' ? ' faded' : ''}${draggingTaskId === task.id ? ' dragging' : ''}`}
                              key={task.id}
                              draggable
                              onClick={() => { if (draggingTaskId === null) setSelectedTaskId(task.id) }}
                              onDragStart={(e) => {
                                setDraggingTaskId(task.id)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              onDragEnd={() => {
                                setDraggingTaskId(null)
                                setDragOverColumn(null)
                              }}
                              type="button"
                            >
                              <div className="k-card-title">{task.title}</div>
                              <div className="k-card-meta">
                                <span className={`k-tag ${task.categoryClass}`}>{task.category}</span>
                                <span className="k-owner">{task.owner}</span>
                              </div>
                              <div className={`k-due ${task.overdue ? 'overdue' : ''}`}>{formatDueLabel(task.due, task.overdue)}</div>
                            </button>
                          ))}
                          <button className="k-add" type="button" onClick={() => addKanbanTask(column.key)}>+ 카드 추가</button>
                        </div>
                      )
                    })}
                  </div>

                  {selectedTask && (
                    <div className="task-modal-backdrop" onClick={() => setSelectedTaskId(null)}>
                      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="task-panel-top">
                          <div>
                            <p className="task-panel-eyebrow">태스크 상세</p>
                            <h3 className="task-panel-title">{selectedTask.title}</h3>
                            {taskNotice ? <p className="task-panel-notice">{taskNotice}</p> : null}
                          </div>
                          <div className="task-modal-actions">
                            <span className={`task-status-chip status-${selectedTask.status}`}>{kanbanColumns.find((column) => column.key === selectedTask.status)?.label}</span>
                            <button className="task-delete" type="button" onClick={() => deleteTask(selectedTask.id)}>삭제</button>
                            <button className="task-close" type="button" onClick={() => setSelectedTaskId(null)}>닫기</button>
                          </div>
                        </div>

                        <div className="task-form">
                          <label className="task-field">
                            <span>제목</span>
                            <input
                              className="task-input"
                              value={selectedTask.title}
                              onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                            />
                          </label>

                          <div className="task-field-grid">
                            <label className="task-field">
                              <span>상태</span>
                              <select
                                className="task-input"
                                value={selectedTask.status}
                                onChange={(e) => updateTask(selectedTask.id, { status: e.target.value as KanbanColumnKey }, { immediate: true })}
                              >
                                {kanbanColumns.map((column) => (
                                  <option key={column.key} value={column.key}>{column.label}</option>
                                ))}
                              </select>
                            </label>

                            <label className="task-field">
                              <span>마감 날짜</span>
                              <input
                                className="task-input"
                                type="date"
                                value={selectedTask.status === 'done' ? '' : toDateInputValue(selectedTask.due)}
                                onChange={(e) => updateTask(selectedTask.id, { due: e.target.value || '미정' }, { immediate: true })}
                                disabled={selectedTask.status === 'done'}
                              />
                            </label>
                          </div>

                          <div className="task-field-grid">
                            <label className="task-field">
                              <span>분류</span>
                              <input
                                className="task-input"
                                value={selectedTask.category}
                                onChange={(e) => updateTask(selectedTask.id, { category: e.target.value })}
                              />
                            </label>

                            <label className="task-field">
                              <span>담당</span>
                              <input
                                className="task-input"
                                value={selectedTask.owner}
                                onChange={(e) => updateTask(selectedTask.id, { owner: e.target.value })}
                              />
                            </label>
                          </div>

                          <label className="task-field">
                            <span>설명</span>
                            <textarea
                              className="task-textarea"
                              value={selectedTask.description}
                              onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                            />
                          </label>

                          <label className="task-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedTask.overdue)}
                              disabled={selectedTask.status === 'done'}
                              onChange={(e) => updateTask(selectedTask.id, { overdue: e.target.checked }, { immediate: true })}
                            />
                            <span>마감 초과 표시</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activePage === 'schedule' && (
                <div className="page active">
                  <ScheduleView roomId={roomId} sessionId={sessionId} />
                </div>
              )}

              {activePage === 'docs' && (
                <DocumentsView documents={docsData} />
              )}

              {activePage === 'notif' && (
                <NotificationsView notifications={notifications} />
              )}

              {activePage === 'todo' && (
                <TodoView
                  todos={todos}
                  todoInput={todoInput}
                  composingRef={todoComposingRef}
                  onInputChange={setTodoInput}
                  onAddTodo={addTodo}
                  onToggleTodo={toggleTodo}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      <GlobalStyles />
    </>
  )
}
