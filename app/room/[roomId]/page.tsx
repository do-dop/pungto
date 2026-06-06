'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { getRoomTitle, joinRoomWithPassword } from '@/lib/auth'
import { getSessionId, getSavedName, saveName } from '@/lib/session'
import { ChatView } from './features/chat/components/ChatView'
import type { Message } from './features/chat/types'
import { DashboardView } from './features/dashboard/components/DashboardView'
import {
  initialDashboardLinks,
  initialProjectGoal,
  initialProjectName,
  initialProjectSummary,
  initialTeamRoles,
} from './features/dashboard/constants'
import type {
  DashboardLink,
  DashboardLinkRow,
  DashboardMetaRow,
  TeamRole,
  TeamRoleRow,
} from './features/dashboard/types'
import { mapDashboardLinkRow, mapTeamRoleRow } from './features/dashboard/utils'
import { DocumentsView } from './features/documents/components/DocumentsView'
import { KanbanView } from './features/kanban/components/KanbanView'
import { initialKanbanTasks, kanbanColumns } from './features/kanban/constants'
import type { KanbanColumnKey, KanbanTask, TaskRow } from './features/kanban/types'
import { buildTaskInsert, buildTaskUpdate, mapTaskRow } from './features/kanban/utils'
import { NotificationsView } from './features/notifications/components/NotificationsView'
import { GlobalStyles } from './features/room/components/GlobalStyles'
import { NavIcon } from './features/room/components/NavIcon'
import { TodoView } from './features/todos/components/TodoView'
import {
  docsData,
  initialTodos,
  notifications,
  pageTitles,
  SHELL_BACKGROUND_STORAGE_KEY,
  shellBackgroundLabels,
} from './features/room/constants'
import type {
  PageKey,
  ShellBackgroundKey,
  TodoItem,
} from './features/room/types'
import {
  formatSupabaseError,
  getNextShellBackground,
  getShellBackgroundStyle,
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
  const [roomTitle, setRoomTitle] = useState('Pungto')
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [roomPassword, setRoomPassword] = useState('')
  const [joinNotice, setJoinNotice] = useState('')
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
    if (!roomId) return

    let cancelled = false

    getRoomTitle(roomId)
      .then((title) => {
        if (!cancelled) setRoomTitle(title)
      })
      .catch((error) => {
        console.error('Load room title error:', error)
      })

    return () => {
      cancelled = true
    }
  }, [roomId])

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
    const password = roomPassword.trim()
    if (!password) {
      setJoinNotice('방 비밀번호를 입력해주세요')
      return
    }

    let userId = authUserId
    try {
      const user = await joinRoomWithPassword(roomId, password, trimmed)
      userId = user.id
      setAuthUserId(user.id)
      setJoinNotice('')
    } catch (error) {
      console.error('Register room member error:', error)
      setJoinNotice('비밀번호가 맞지 않거나 방에 입장할 수 없습니다')
      return
    }

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

    setAuthUserId(userId)
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
            <div className="join-room-title">{roomTitle}</div>
            <p className="join-desc">이름과 방 비밀번호를 입력하면 시작해요</p>
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
            <input
              className="join-input"
              type="password"
              placeholder="방 비밀번호"
              value={roomPassword}
              onChange={(e) => {
                setRoomPassword(e.target.value)
                setJoinNotice('')
              }}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !composingRef.current) join()
              }}
              autoComplete="current-password"
            />
            {joinNotice && <p className="join-error">{joinNotice}</p>}
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
              <div className="topbar-title">
                <span className="room-title">{roomTitle}</span>
                <span className="page-title">{pageTitles[activePage]}</span>
              </div>
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
                <DashboardView
                  roomId={roomId}
                  dashboardNotice={dashboardNotice}
                  projectName={projectName}
                  projectSummary={projectSummary}
                  projectGoal={projectGoal}
                  dashboardLinks={dashboardLinks}
                  linkKindInput={linkKindInput}
                  linkLabelInput={linkLabelInput}
                  linkUrlInput={linkUrlInput}
                  teamRoles={teamRoles}
                  onProjectNameChange={(nextValue) => {
                    setProjectName(nextValue)
                    scheduleDashboardMetaSave(nextValue, projectSummary, projectGoal)
                  }}
                  onProjectSummaryChange={(nextValue) => {
                    setProjectSummary(nextValue)
                    scheduleDashboardMetaSave(projectName, nextValue, projectGoal)
                  }}
                  onProjectGoalChange={(nextValue) => {
                    setProjectGoal(nextValue)
                    scheduleDashboardMetaSave(projectName, projectSummary, nextValue)
                  }}
                  onLinkKindChange={setLinkKindInput}
                  onLinkLabelChange={setLinkLabelInput}
                  onLinkUrlChange={setLinkUrlInput}
                  onAddDashboardLink={addDashboardLink}
                  onRemoveDashboardLink={removeDashboardLink}
                  onAddTeamRole={addTeamRole}
                  onUpdateTeamRole={updateTeamRole}
                  onRemoveTeamRole={removeTeamRole}
                />
              )}

              {activePage === 'chat' && (
                <ChatView
                  messages={messages}
                  sessionId={sessionId}
                  input={input}
                  chatScrollRef={chatScrollRef}
                  bottomRef={bottomRef}
                  composingRef={composingRef}
                  onInputChange={setInput}
                  onSendMessage={sendMessage}
                />
              )}

              {activePage === 'kanban' && (
                <KanbanView
                  columns={kanbanColumns}
                  tasks={kanbanTasks}
                  selectedTask={selectedTask}
                  selectedTaskId={selectedTaskId}
                  draggingTaskId={draggingTaskId}
                  dragOverColumn={dragOverColumn}
                  taskNotice={taskNotice}
                  onDragOverColumn={setDragOverColumn}
                  onClearDragOverColumn={() => setDragOverColumn(null)}
                  onDraggingTaskChange={setDraggingTaskId}
                  onSelectTask={setSelectedTaskId}
                  onUpdateTask={updateTask}
                  onAddTask={addKanbanTask}
                  onDeleteTask={deleteTask}
                />
              )}

              {activePage === 'schedule' && (
                <div className="page active">
                  <ScheduleView roomId={roomId} sessionId={authUserId ?? sessionId} />
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
