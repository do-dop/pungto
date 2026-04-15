'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { getSessionId, getSavedName, saveName } from '@/lib/session'

type Message = {
  id: string
  display_name: string
  content: string
  session_id: string
  created_at: string
}

type PageKey = 'dashboard' | 'chat' | 'kanban' | 'schedule' | 'docs' | 'notif' | 'todo'
type ShellBackgroundKey = 'default' | 'rolophus'

type TodoItem = {
  id: number
  text: string
  due: string
  urgent?: boolean
  done?: boolean
}

type KanbanColumnKey = 'todo' | 'doing' | 'review' | 'done'

type KanbanTask = {
  id: number
  title: string
  category: string
  categoryClass: string
  due: string
  description: string
  owner: string
  status: KanbanColumnKey
  overdue?: boolean
}

type TaskRow = {
  id: number
  room_id: string
  title: string
  description: string
  status: KanbanColumnKey
  category: string
  category_class: string
  owner_name: string
  due_text: string
  is_overdue: boolean
  position: number
  created_by_session_id: string | null
  created_at: string
  updated_at: string
}

type DashboardLink = {
  id: number
  label: string
  url: string
  kind: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
}

type TeamRole = {
  id: number
  name: string
  role: string
}

type DashboardMetaRow = {
  room_id: string
  project_name?: string
  summary: string
  goal: string
  updated_at: string
}

type DashboardLinkRow = {
  id: number
  room_id: string
  label: string
  url: string
  kind: DashboardLink['kind']
  position: number
  created_at: string
}

type TeamRoleRow = {
  id: number
  room_id: string
  name: string
  role: string
  position: number
  created_at: string
  updated_at: string
}

const pageTitles: Record<PageKey, string> = {
  dashboard: '프로젝트 — 대시보드',
  chat: '채팅',
  kanban: '프로젝트 — 칸반 보드',
  schedule: '프로젝트 — 일정',
  docs: '자료',
  notif: '알림',
  todo: '할 일',
}

const kanbanColumns: Array<{ key: KanbanColumnKey; label: string }> = [
  { key: 'todo', label: '할 일' },
  { key: 'doing', label: '진행 중' },
  { key: 'review', label: '검토 중' },
  { key: 'done', label: '완료' },
]

const initialKanbanTasks: KanbanTask[] = [
  {
    id: 1,
    title: '경쟁사 UI 벤치마킹',
    category: '기획',
    categoryClass: 'tag-p',
    due: '~ 4/18',
    owner: '이수연',
    status: 'todo',
    description: '주요 경쟁 서비스 5개를 비교해서 IA, 온보딩, 협업 경험 차이를 정리합니다.',
  },
  {
    id: 2,
    title: '사용자 인터뷰 설계',
    category: '리서치',
    categoryClass: 'tag-t',
    due: '~ 4/20',
    owner: '김정현',
    status: 'todo',
    description: '인터뷰 대상자 기준과 핵심 질문 리스트를 정리하고 사전 스크립트를 작성합니다.',
  },
  {
    id: 3,
    title: '랜딩 페이지 카피 작성',
    category: '마케팅',
    categoryClass: 'tag-a',
    due: '~ 4/12 마감 초과',
    owner: '나',
    status: 'todo',
    overdue: true,
    description: '첫 방문 사용자가 5초 안에 제품 가치를 이해할 수 있도록 헤드라인과 서브카피를 다듬습니다.',
  },
  {
    id: 4,
    title: '프로토타입 1차 개발',
    category: '개발',
    categoryClass: 'tag-p',
    due: '~ 4/22',
    owner: '박준호',
    status: 'doing',
    description: '핵심 협업 흐름과 방 입장 경험을 우선 구현하고, 모바일 레이아웃도 함께 점검합니다.',
  },
  {
    id: 5,
    title: '기획서 v2 작성',
    category: '기획',
    categoryClass: 'tag-t',
    due: '~ 4/19',
    owner: '이수연',
    status: 'doing',
    description: '화면 흐름 업데이트와 함께 우선순위, 실험 범위, 검증 지표를 다시 정리합니다.',
  },
  {
    id: 6,
    title: '디자인 시스템 정의',
    category: '디자인',
    categoryClass: 'tag-a',
    due: '~ 4/16',
    owner: '김정현',
    status: 'review',
    description: '컬러, 타이포, 버튼, 입력창 규칙을 정리해서 이후 화면 작업에 재사용할 수 있게 합니다.',
  },
  {
    id: 7,
    title: '프로젝트 킥오프 미팅',
    category: '기획',
    categoryClass: 'tag-t',
    due: '완료',
    owner: '팀 전체',
    status: 'done',
    description: '프로젝트 목표와 역할 분담을 확정했습니다.',
  },
  {
    id: 8,
    title: '팀 온보딩 문서 공유',
    category: '기획',
    categoryClass: 'tag-p',
    due: '완료',
    owner: '나',
    status: 'done',
    description: '필수 문서와 작업 규칙을 팀에 공유했습니다.',
  },
]

function mapTaskRow(row: TaskRow): KanbanTask {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryClass: row.category_class,
    due: row.due_text,
    description: row.description,
    owner: row.owner_name,
    status: row.status,
    overdue: row.is_overdue,
  }
}

function buildTaskInsert(task: KanbanTask, roomId: string, sessionId: string, position: number) {
  return {
    room_id: roomId,
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    category_class: task.categoryClass,
    owner_name: task.owner,
    due_text: task.due,
    is_overdue: Boolean(task.overdue),
    position,
    created_by_session_id: sessionId,
  }
}

function buildTaskUpdate(task: KanbanTask) {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    category_class: task.categoryClass,
    owner_name: task.owner,
    due_text: task.due,
    is_overdue: Boolean(task.overdue),
  }
}

function mapDashboardLinkRow(row: DashboardLinkRow): DashboardLink {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    kind: row.kind,
  }
}

function mapTeamRoleRow(row: TeamRoleRow): TeamRole {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
  }
}

const docsData = [
  { ext: 'DOC', className: 'di-doc', name: 'Q2 기획서 v2', meta: '방금 수정됨' },
  { ext: 'DOC', className: 'di-doc', name: '온보딩 가이드', meta: '3일 전 수정됨' },
  { ext: 'PDF', className: 'di-pdf', name: '경쟁사 분석 보고서', meta: '이수연 · 1주 전' },
  { ext: 'IMG', className: 'di-img', name: '디자인 시스템 v1', meta: '김정현 · 2일 전' },
  { ext: 'XLS', className: 'di-xls', name: '예산 계획서', meta: '나 · 4일 전' },
  { ext: 'DOC', className: 'di-doc', name: '회의록 4/7', meta: '김정현 · 7일 전' },
]

const notifications = [
  { tone: 'ni-r', title: '<b>랜딩 페이지 카피</b> 마감이 지났어요', time: '30분 전', unread: true },
  { tone: 'ni-p', title: '<b>이수연</b>이 채팅에 메시지를 남겼어요', time: '1시간 전', unread: true },
  { tone: 'ni-a', title: '오늘 오후 3시 <b>팀 위클리</b> 일정이 있어요', time: '2시간 전', unread: true },
  { tone: 'ni-t', title: '<b>김정현</b>이 디자인 시스템 v1 파일을 업로드했어요', time: '어제 오후 4:12' },
  { tone: 'ni-p', title: '<b>프로토타입 1차 개발</b> 카드가 진행 중으로 이동됐어요', time: '어제 오전 11:30' },
]

const initialTodos: TodoItem[] = [
  { id: 1, text: '랜딩 페이지 카피 초안 완성', due: '오늘 마감', urgent: true },
  { id: 2, text: '팀 위클리 준비 — 주간 요약 작성', due: '오늘 오후 2시', urgent: true },
  { id: 3, text: '기획서 v2 공유', due: '완료', done: true },
  { id: 4, text: '경쟁사 UI 벤치마킹 리포트', due: '4/18' },
  { id: 5, text: '사용자 인터뷰 설계서 작성', due: '4/20' },
  { id: 6, text: '디자인 시스템 검토 참석', due: '4/16' },
]

const initialDashboardLinks: DashboardLink[] = [
  { id: 1, label: '프로덕트 리포지토리', url: 'https://github.com/team/pungto', kind: 'github' },
  { id: 2, label: '메인 피그마 파일', url: 'https://www.figma.com/file/example', kind: 'figma' },
  { id: 3, label: '기획 노션 문서', url: 'https://www.notion.so/example', kind: 'notion' },
]

const initialTeamRoles: TeamRole[] = [
  { id: 1, name: '이수연', role: 'PM' },
  { id: 2, name: '김정현', role: 'Product Designer' },
  { id: 3, name: '박준호', role: 'Frontend Developer' },
]

const initialProjectSummary = '가입 없이 빠르게 협업방을 만들고, 실시간 채팅과 태스크 관리까지 한 번에 해결하는 팀 협업 도구를 만들고 있습니다.'
const initialProjectGoal = '첫 사용자가 3분 안에 방 생성, 팀 초대, 첫 태스크 등록까지 완료할 수 있게 만드는 것이 현재 목표입니다.'
const initialProjectName = 'Pungto 프로젝트'
const SHELL_BACKGROUND_STORAGE_KEY = 'pungto-room-shell-background'

const shellBackgroundLabels: Record<ShellBackgroundKey, string> = {
  default: '기본',
  rolophus: '롤로퍼스',
}

const shellBackgroundOrder: ShellBackgroundKey[] = ['default', 'rolophus']

function getShellBackgroundStyle(backgroundKey: ShellBackgroundKey): CSSProperties {
  if (backgroundKey === 'rolophus') {
    return {
      backgroundColor: '#efe8dc',
      backgroundImage: "linear-gradient(rgba(249, 245, 239, 0.3), rgba(249, 245, 239, 0.3)), url('/rolophus.webp')",
      backgroundSize: '180px 180px',
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center',
    }
  }

  return {
    backgroundImage: `
      radial-gradient(circle at top, rgba(83, 74, 183, 0.1), transparent 30%),
      linear-gradient(180deg, #f7f3ee 0%, #f5f5f3 100%)
    `,
  }
}

function getNextShellBackground(backgroundKey: ShellBackgroundKey): ShellBackgroundKey {
  const currentIndex = shellBackgroundOrder.indexOf(backgroundKey)
  return shellBackgroundOrder[(currentIndex + 1) % shellBackgroundOrder.length]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const hh = d.getHours()
  const mm = d.getMinutes()
  const ampm = hh < 12 ? '오전' : '오후'
  const h = hh % 12 || 12
  return `${ampm} ${h}:${mm < 10 ? '0' : ''}${mm}`
}

function toDateInputValue(due: string) {
  if (!due || due === '완료' || due === '미정') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due

  const match = due.match(/(\d{1,2})\/(\d{1,2})/)
  if (!match) return ''

  const year = new Date().getFullYear()
  const month = match[1].padStart(2, '0')
  const day = match[2].padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDueLabel(due: string, isOverdue?: boolean) {
  if (!due) return '미정'
  if (due === '완료') return due
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const [, month, day] = due.split('-')
    return `${Number(month)}/${Number(day)}${isOverdue ? ' 마감 초과' : ''}`
  }
  return due
}

const AV_COLORS = ['av-p', 'av-t', 'av-c']
function getAvColor(name: string) {
  const safe = name?.trim() || '익명'
  const idx = safe.charCodeAt(0) % AV_COLORS.length
  return AV_COLORS[idx]
}

function NavIcon({ type }: { type: PageKey }) {
  if (type === 'dashboard') return <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3z"/><path d="M13 21h8v-6h-8z"/><path d="M13 10h8V3h-8z"/><path d="M3 21h8v-6H3z"/></svg>
  if (type === 'chat') return <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (type === 'kanban') return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/></svg>
  if (type === 'schedule') return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (type === 'docs') return <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
  if (type === 'notif') return <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  return <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}

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
        console.error('Load dashboard error:', { metaError, linksError, rolesError })
        if (!cancelled) setDashboardNotice('대시보드를 불러오지 못했어요')
        return
      }

      if (!meta) {
        const { error: seedMetaError } = await supabase.from('room_dashboard').insert({
          room_id: roomId,
          project_name: initialProjectName,
          summary: initialProjectSummary,
          goal: initialProjectGoal,
        })

        if (seedMetaError) {
          console.error('Seed room_dashboard error:', seedMetaError)
          if (!cancelled) setDashboardNotice('대시보드 초기화에 실패했어요')
          return
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
          console.error('Seed dashboard_links error:', seedLinksError)
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
          console.error('Seed team_roles error:', seedRolesError)
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
                  <div className="sched-header">
                    <button className="nav-arrow">‹</button>
                    <span className="sched-month">2026년 4월</span>
                    <button className="nav-arrow">›</button>
                  </div>
                  <div className="cal-grid">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d} className="cal-day-label">{d}</div>)}
                    {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day, index) => (
                      <div key={index} className={`cal-cell ${day === 14 ? 'today' : ''}`}>
                        <div className={`day-num ${index < 2 ? 'muted-day' : ''}`}>{day}</div>
                        {day === 7 && <div className="cal-event">킥오프 미팅</div>}
                        {day === 10 && <div className="cal-event teal">기획서 v1</div>}
                        {day === 14 && <div className="cal-event">팀 위클리</div>}
                        {day === 16 && <div className="cal-event coral">디자인 검토</div>}
                        {day === 22 && <div className="cal-event">프로토타입 데모</div>}
                        {day === 29 && <div className="cal-event teal">스프린트 회고</div>}
                      </div>
                    ))}
                  </div>
                  <div className="sched-list">
                    <div className="sched-item"><div className="sched-dot purple"></div><div className="sched-info"><div className="sched-title">팀 위클리</div><div className="sched-meta">오늘 · 오후 3:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot coral"></div><div className="sched-info"><div className="sched-title">디자인 시스템 검토</div><div className="sched-meta">4월 16일 · 오전 11:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot purple"></div><div className="sched-info"><div className="sched-title">프로토타입 데모</div><div className="sched-meta">4월 22일 · 오후 2:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot teal"></div><div className="sched-info"><div className="sched-title">스프린트 회고</div><div className="sched-meta">4월 29일 · 오후 5:00</div></div></div>
                  </div>
                </div>
              )}

              {activePage === 'docs' && (
                <div className="page active">
                  <div className="docs-toolbar">
                    <input className="search-input" placeholder="파일 검색..." />
                    <button className="btn-upload">+ 업로드</button>
                  </div>
                  <div className="docs-grid">
                    {docsData.map((doc) => (
                      <div className="doc-card" key={doc.name}>
                        <div className={`doc-icon ${doc.className}`}>{doc.ext}</div>
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">{doc.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePage === 'notif' && (
                <div className="page active">
                  <div className="notif-section-label">오늘</div>
                  <div className="notif-list">
                    {notifications.map((item, index) => (
                      <div key={index}>
                        {index === 3 && <div className="notif-section-label nested">어제</div>}
                        <div className="notif-item">
                          <div className={`notif-icon ${item.tone}`} />
                          <div className="notif-body">
                            <div className="notif-title" dangerouslySetInnerHTML={{ __html: item.title }} />
                            <div className="notif-time">{item.time}</div>
                          </div>
                          {item.unread ? <div className="unread-dot" /> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePage === 'todo' && (
                <div className="page active todo-page">
                  <div className="todo-section-label">오늘 할 일</div>
                  <div className="todo-list">
                    {todos.map((todo, index) => (
                      <div key={todo.id}>
                        {index === 3 && <div className="todo-section-label nested-todo">이번 주</div>}
                        <div className="todo-item">
                          <button className={`todo-check ${todo.done ? 'done' : ''}`} onClick={() => toggleTodo(todo.id)} />
                          <span className={`todo-text ${todo.done ? 'done' : ''}`}>{todo.text}</span>
                          <span className={`todo-due ${todo.urgent && !todo.done ? 'urgent' : ''}`}>{todo.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="todo-add-row">
                    <input
                      className="todo-add-input"
                      value={todoInput}
                      onChange={(e) => setTodoInput(e.target.value)}
                      onCompositionStart={() => { todoComposingRef.current = true }}
                      onCompositionEnd={() => { todoComposingRef.current = false }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !todoComposingRef.current) addTodo()
                      }}
                      placeholder="할 일을 입력하세요..."
                    />
                    <button className="btn-add" onClick={addTodo}>추가</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <GlobalStyles />
    </>
  )
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body {
        font-family: 'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif;
        background: #f5f5f3;
      }
      .join-shell, .page-shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 16px;
        background:
          radial-gradient(circle at top, rgba(83, 74, 183, 0.1), transparent 30%),
          linear-gradient(180deg, #f7f3ee 0%, #f5f5f3 100%);
      }
      .shell-fab {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 56px;
        height: 56px;
        border: 1px solid rgba(224, 221, 213, 0.95);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.88);
        color: #534AB7;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.06em;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 16px 36px rgba(31, 29, 47, 0.14);
        backdrop-filter: blur(14px);
        z-index: 5;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .shell-fab:hover {
        transform: translateY(-1px);
        box-shadow: 0 20px 40px rgba(31, 29, 47, 0.18);
        background: rgba(255, 255, 255, 0.96);
      }
      .join-card {
        width: 100%;
        max-width: 360px;
        padding: 28px 24px 24px;
        border: 1px solid rgba(224, 221, 213, 0.95);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 24px 60px rgba(57, 50, 130, 0.08);
        text-align: center;
        backdrop-filter: blur(14px);
      }
      .join-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
        border-radius: 999px;
        background: #f0effd;
        color: #534ab7;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        margin-bottom: 18px;
      }
      .join-logo {
        width: 54px;
        height: 54px;
        margin: 0 auto 12px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
        background: linear-gradient(135deg, #5c53c9 0%, #847ce3 100%);
        box-shadow: 0 14px 28px rgba(83, 74, 183, 0.22);
      }
      .join-title { font-size: 28px; line-height: 1.1; font-weight: 700; color: #1f1d2f; margin-bottom: 8px; }
      .join-desc { font-size: 14px; line-height: 1.6; color: #7d7888; margin-bottom: 20px; }
      .join-input {
        width: 100%; border: 1px solid #e7dfd3; border-radius: 16px; padding: 14px 16px; font-size: 15px;
        text-align: center; outline: none; background: #fbf8f3; color: #1f1d2f; font-family: inherit; margin-bottom: 12px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .join-input:focus { border-color: #7f77dd; box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12); background: #fff; }
      .join-btn {
        width: 100%; background: linear-gradient(135deg, #5a52c4 0%, #7f77dd 100%); color: #fff; border: none; border-radius: 16px; padding: 14px 0;
        font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 16px 30px rgba(83, 74, 183, 0.22);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .join-btn:hover { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(83, 74, 183, 0.28); }
      .join-hint { margin-top: 12px; font-size: 12px; color: #9a94a4; }
      .wrap {
        display: flex; width: 100%; max-width: 960px; height: 720px; border: 1px solid #e0ddd5; border-radius: 16px;
        overflow: hidden; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      }
      .sidebar {
        width: 52px; border-right: 1px solid #e0ddd5; display: flex; flex-direction: column; align-items: center;
        padding: 12px 0; gap: 4px; background: #faf9f7; flex-shrink: 0;
      }
      .logo { font-size: 20px; color: #534AB7; margin-bottom: 8px; font-weight: 700; line-height: 1; }
      .nav-btn {
        width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; cursor: pointer;
        display: flex; align-items: center; justify-content: center; position: relative; transition: background 0.15s;
      }
      .nav-btn:hover { background: #f0eff8; }
      .nav-btn.active { background: #EEEDFE; }
      .nav-btn svg {
        width: 18px; height: 18px; stroke: #888; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
        transition: stroke 0.15s;
      }
      .nav-btn.active svg { stroke: #534AB7; }
      .badge {
        position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; background: #E24B4A; border-radius: 50%; border: 1.5px solid #faf9f7;
      }
      .nav-sep { width: 24px; height: 1px; background: #e0ddd5; margin: 4px 0; }
      .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
      .topbar {
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .page-title { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
      .url-pill {
        display: flex; align-items: center; gap: 5px; background: #f5f5f3; border: 1px solid #e0ddd5; border-radius: 20px;
        padding: 4px 10px; font-size: 11px; color: #888; cursor: pointer; transition: border-color 0.15s;
      }
      .url-pill:hover { border-color: #bbb; }
      .green-dot { width: 5px; height: 5px; background: #1D9E75; border-radius: 50%; flex-shrink: 0; }
      .btn-share {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;
      }
      .btn-share:hover { background: #7F77DD; }
      .share-panel {
        display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #e0ddd5; background: #faf9f7; flex-shrink: 0;
      }
      .share-info { flex: 1; min-width: 0; }
      .share-label { font-size: 11px; color: #aaa; margin-bottom: 4px; }
      .share-url {
        font-size: 11px; font-family: monospace; color: #534AB7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .copy-btn {
        margin-top: 8px; background: #534AB7; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-family: inherit;
      }
      .content { flex: 1; overflow: hidden; min-height: 0; }
      .page { height: 100%; overflow: hidden; }
      .page.active { display: flex; flex-direction: column; min-height: 0; }
      .dashboard-page { overflow-y: auto; background: linear-gradient(180deg, #fcfbf8 0%, #f6f3ee 100%); }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 16px;
        padding: 14px;
        align-content: start;
      }
      .dash-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e5dfd5;
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 16px 40px rgba(57, 50, 130, 0.05);
      }
      .dash-hero { grid-column: span 2; }
      .dash-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .dash-eyebrow {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #978fa1;
        margin-bottom: 6px;
      }
      .dash-title {
        font-size: 20px;
        line-height: 1.2;
        color: #1f1d2f;
        font-weight: 700;
      }
      .dash-notice {
        margin-top: 8px;
        font-size: 12px;
        color: #8b8594;
      }
      .dash-room-chip {
        padding: 8px 12px;
        border-radius: 999px;
        background: #f2f0fd;
        color: #534ab7;
        font-size: 12px;
        font-weight: 700;
      }
      .dash-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      .dash-field span {
        font-size: 12px;
        font-weight: 600;
        color: #746d7a;
      }
      .dash-project-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
        min-height: 56px;
      }
      .dash-input, .dash-textarea {
        width: 100%;
        border: 1px solid #e4ddd2;
        border-radius: 14px;
        background: #fff;
        color: #1f1d2f;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .dash-input {
        min-height: 44px;
        padding: 11px 13px;
      }
      .dash-input.compact {
        min-height: 40px;
        padding: 9px 12px;
      }
      .dash-textarea {
        min-height: 96px;
        resize: vertical;
        padding: 12px 13px;
        line-height: 1.65;
      }
      .dash-textarea.compact { min-height: 76px; }
      .dash-input:focus, .dash-textarea:focus {
        border-color: #7f77dd;
        box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12);
      }
      .dash-link-form {
        display: grid;
        grid-template-columns: 120px 1fr 1.3fr auto;
        gap: 10px;
        margin-bottom: 12px;
      }
      .dash-primary-btn, .dash-ghost-btn {
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .dash-primary-btn {
        border: none;
        background: linear-gradient(135deg, #5a52c4 0%, #7f77dd 100%);
        color: #fff;
      }
      .dash-ghost-btn {
        border: 1px solid #ddd6cb;
        background: #fff;
        color: #6f6875;
      }
      .dash-link-list, .team-role-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .team-role-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 72px;
        gap: 8px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 700;
        color: #9991a5;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .dash-link-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #ebe4d9;
        border-radius: 16px;
        background: #fcfbf8;
      }
      .dash-link-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .dash-link-icon.kind-github { background: #ece9ff; color: #40379a; }
      .dash-link-icon.kind-figma { background: #ffe7e1; color: #b54624; }
      .dash-link-icon.kind-notion { background: #ecebe7; color: #4c4640; }
      .dash-link-icon.kind-docs { background: #e4f6ef; color: #0d6a54; }
      .dash-link-icon.kind-etc { background: #f7eddc; color: #8a5807; }
      .dash-link-copy { flex: 1; min-width: 0; }
      .dash-link-label { font-size: 14px; font-weight: 600; color: #1f1d2f; margin-bottom: 4px; }
      .dash-link-url {
        display: block;
        font-size: 12px;
        color: #7c75b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;
      }
      .team-role-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 1px solid #ebe4d9;
        border-radius: 16px;
        background: #fcfbf8;
        padding: 10px;
      }
      .team-name { font-weight: 700; }
      .compact-btn {
        min-height: 40px;
        padding: 9px 12px;
        white-space: nowrap;
      }
      .chat-page, .todo-page { min-height: 0; }
      .chat-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; min-height: 0;
      }
      .sticky-input { flex-shrink: 0; position: sticky; bottom: 0; z-index: 2; }
      .empty-chat { text-align: center; color: #ccc; font-size: 13px; margin-top: 32px; }
      .msg { display: flex; gap: 10px; align-items: flex-end; }
      .msg.me { flex-direction: row-reverse; }
      .av {
        width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0;
      }
      .av-p { background: #CECBF6; color: #3C3489; }
      .av-t { background: #9FE1CB; color: #085041; }
      .av-c { background: #F5C4B3; color: #712B13; }
      .bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: 68%; }
      .msg.me .bubble-wrap { align-items: flex-end; }
      .sender-name { font-size: 11px; color: #bbb; }
      .bubble {
        background: #f5f5f3; border-radius: 12px 12px 12px 3px; padding: 8px 12px; font-size: 13px; line-height: 1.6; color: #1a1a1a; word-break: break-all;
      }
      .msg.me .bubble { background: #EEEDFE; color: #26215C; border-radius: 12px 12px 3px 12px; }
      .msg-meta { font-size: 11px; color: #bbb; }
      .chat-input-row {
        display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; background: #fff;
      }
      .chat-input, .search-input, .todo-add-input {
        outline: none; font-family: inherit;
      }
      .chat-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 20px; padding: 8px 14px; font-size: 13px; background: #faf9f7; color: #1a1a1a; transition: border-color 0.15s;
      }
      .chat-input:focus, .search-input:focus, .todo-add-input:focus { border-color: #7F77DD; background: #fff; }
      .send-btn {
        width: 34px; height: 34px; background: #534AB7; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
      }
      .send-btn:hover { background: #7F77DD; }
      .send-btn svg { width: 14px; height: 14px; fill: #fff; stroke: #fff; stroke-width: 1.5; }
      .kanban { display: flex; gap: 12px; overflow-x: auto; height: 100%; align-items: flex-start; padding: 16px; }
      .k-col {
        flex: 0 0 195px; background: #faf9f7; border-radius: 12px; border: 1px solid #e0ddd5; padding: 12px; display: flex; flex-direction: column; gap: 8px;
      }
      .k-col-title { font-size: 12px; font-weight: 600; color: #888; display: flex; align-items: center; justify-content: space-between; }
      .k-count { background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 1px 7px; font-size: 11px; color: #aaa; }
      .k-card {
        background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 10px 12px; cursor: grab; width: 100%;
        text-align: left; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s, opacity 0.15s;
      }
      .k-card:hover { border-color: #bbb; transform: translateY(-1px); }
      .k-card.selected { border-color: #7f77dd; box-shadow: 0 0 0 3px rgba(127, 119, 221, 0.12); }
      .k-card.faded { opacity: 0.55; }
      .k-card.dragging { opacity: 0.3; cursor: grabbing; transform: scale(0.97); }
      .k-col.drag-over { background: #eeedfd; border-color: #a49fe8; border-style: dashed; }
      .k-card-title { font-size: 13px; color: #1a1a1a; margin-bottom: 7px; line-height: 1.4; }
      .k-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      .k-tag { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 500; }
      .tag-p { background: #EEEDFE; color: #3C3489; }
      .tag-t { background: #E1F5EE; color: #085041; }
      .tag-a { background: #FAEEDA; color: #633806; }
      .k-owner { font-size: 11px; color: #a09ba8; white-space: nowrap; }
      .k-due { font-size: 11px; color: #aaa; margin-top: 6px; }
      .k-due.overdue { color: #A32D2D; font-weight: 500; }
      .k-add {
        width: 100%; background: transparent; border: 1px dashed #e0ddd5; border-radius: 10px; padding: 7px; font-size: 12px; color: #bbb; cursor: pointer; font-family: inherit;
      }
      .k-add:hover { background: #fff; color: #888; border-color: #bbb; }
      .task-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
        background: rgba(31, 29, 47, 0.36);
        backdrop-filter: blur(6px);
      }
      .task-modal {
        width: min(100%, 640px);
        max-height: min(82vh, 760px);
        border: 1px solid #e0ddd5;
        border-radius: 24px;
        background: linear-gradient(180deg, #fff 0%, #fcfbf8 100%);
        padding: 20px;
        overflow-y: auto;
        box-shadow: 0 28px 80px rgba(31, 29, 47, 0.2);
      }
      .task-panel-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid #ece7dd;
      }
      .task-panel-eyebrow {
        font-size: 11px;
        color: #9a94a4;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .task-panel-title {
        font-size: 20px;
        line-height: 1.3;
        color: #1f1d2f;
        font-weight: 700;
      }
      .task-panel-notice {
        margin-top: 8px;
        font-size: 12px;
        color: #8b8594;
      }
      .task-modal-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .task-close {
        border: 1px solid #dfd9cf;
        background: #fff;
        color: #5e5768;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .task-close:hover {
        border-color: #bfb7c8;
        color: #1f1d2f;
      }
      .task-delete {
        border: 1px solid #f0d2d1;
        background: #fff4f3;
        color: #b43d3a;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .task-delete:hover {
        border-color: #e4a5a1;
        background: #feeceb;
      }
      .task-status-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
      .task-status-chip.status-todo { background: #f1efec; color: #6f6875; }
      .task-status-chip.status-doing { background: #eeedfe; color: #3c3489; }
      .task-status-chip.status-review { background: #faeeda; color: #7c4a0b; }
      .task-status-chip.status-done { background: #e1f5ee; color: #085041; }
      .task-form { display: flex; flex-direction: column; gap: 14px; }
      .task-field { display: flex; flex-direction: column; gap: 7px; }
      .task-field span {
        font-size: 12px;
        font-weight: 600;
        color: #746d7a;
      }
      .task-field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .task-input, .task-textarea {
        width: 100%;
        border: 1px solid #e4ddd2;
        border-radius: 12px;
        background: #fff;
        color: #1f1d2f;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .task-input {
        min-height: 44px;
        padding: 11px 13px;
      }
      .task-textarea {
        min-height: 140px;
        resize: vertical;
        padding: 13px;
        line-height: 1.6;
      }
      .task-input:focus, .task-textarea:focus {
        border-color: #7f77dd;
        box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12);
      }
      .task-input:disabled {
        background: #f3f0ea;
        color: #9c97a3;
      }
      .task-input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.75;
      }
      .task-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #5f5868;
      }
      .task-toggle input {
        width: 16px;
        height: 16px;
        accent-color: #534ab7;
      }
      .sched-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 10px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .sched-month { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
      .nav-arrow {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 3px 9px; font-size: 13px; cursor: pointer; color: #888; font-family: inherit;
      }
      .nav-arrow:hover { border-color: #bbb; color: #444; }
      .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); padding: 0 16px 8px; flex-shrink: 0; }
      .cal-day-label { font-size: 11px; color: #bbb; text-align: center; padding: 4px 0; }
      .cal-cell { min-height: 52px; border: 0.5px solid #f0efe8; padding: 4px; font-size: 11px; color: #888; background: #fff; cursor: pointer; }
      .cal-cell:hover { background: #faf9f7; }
      .cal-cell.today { background: #EEEDFE; }
      .day-num { font-size: 11px; margin-bottom: 2px; color: #888; }
      .muted-day { color: #ddd; }
      .cal-cell.today .day-num { color: #534AB7; font-weight: 600; }
      .cal-event {
        background: #CECBF6; color: #3C3489; border-radius: 3px; padding: 1px 4px; font-size: 10px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cal-event.teal { background: #9FE1CB; color: #085041; }
      .cal-event.coral { background: #F5C4B3; color: #712B13; }
      .sched-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
      .sched-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .sched-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .sched-dot.purple { background: #534AB7; }
      .sched-dot.coral { background: #D85A30; }
      .sched-dot.teal { background: #1D9E75; }
      .sched-info { flex: 1; }
      .sched-title { font-size: 13px; color: #1a1a1a; font-weight: 500; }
      .sched-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
      .docs-toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .search-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 6px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-upload {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer; color: #888; font-family: inherit; font-weight: 500; white-space: nowrap;
      }
      .btn-upload:hover { border-color: #bbb; color: #444; }
      .docs-grid {
        display: grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap: 10px; padding: 14px 16px; overflow-y: auto; flex: 1; align-content: start;
      }
      .doc-card { background: #fff; border: 1px solid #e0ddd5; border-radius: 12px; padding: 14px; cursor: pointer; }
      .doc-card:hover { border-color: #bbb; }
      .doc-icon {
        width: 36px; height: 44px; border-radius: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
      }
      .di-doc { background: #EEEDFE; color: #534AB7; }
      .di-pdf { background: #FCEBEB; color: #A32D2D; }
      .di-img { background: #FAEEDA; color: #854F0B; }
      .di-xls { background: #EAF3DE; color: #3B6D11; }
      .doc-name { font-size: 13px; color: #1a1a1a; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .doc-meta { font-size: 11px; color: #aaa; }
      .notif-section-label, .todo-section-label {
        padding: 8px 16px 4px; font-size: 11px; font-weight: 600; color: #bbb; letter-spacing: 0.04em; flex-shrink: 0;
      }
      .notif-section-label.nested, .todo-section-label.nested-todo { padding-top: 10px; padding-left: 16px; }
      .notif-list { flex: 1; overflow-y: auto; }
      .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f0efe8; cursor: pointer; }
      .notif-item:hover { background: #faf9f7; }
      .notif-icon { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; }
      .ni-p { background: #EEEDFE; }
      .ni-t { background: #E1F5EE; }
      .ni-a { background: #FAEEDA; }
      .ni-r { background: #FCEBEB; }
      .notif-body { flex: 1; }
      .notif-title { font-size: 13px; color: #1a1a1a; line-height: 1.5; }
      .notif-title b { font-weight: 600; }
      .notif-time { font-size: 11px; color: #bbb; margin-top: 2px; }
      .unread-dot { width: 6px; height: 6px; background: #534AB7; border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
      .todo-list { flex: 1; overflow-y: auto; padding: 0 16px; min-height: 0; }
      .todo-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .todo-check {
        width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #ddd; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff;
      }
      .todo-check:hover { border-color: #7F77DD; }
      .todo-check.done { background: #534AB7; border-color: #534AB7; position: relative; }
      .todo-check.done::after {
        content: ''; display: block; width: 9px; height: 5px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translateY(-1px);
      }
      .todo-text { flex: 1; font-size: 13px; color: #1a1a1a; }
      .todo-text.done { color: #bbb; text-decoration: line-through; }
      .todo-due { font-size: 11px; color: #aaa; white-space: nowrap; }
      .todo-due.urgent { color: #A32D2D; font-weight: 600; }
      .todo-add-row {
        display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .todo-add-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 7px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-add {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .btn-add:hover { background: #7F77DD; }
      @media (max-width: 820px) {
        .page-shell, .join-shell { padding: 0; }
        .wrap { height: 100vh; max-width: none; border-radius: 0; border-left: 0; border-right: 0; }
        .url-pill { display: none; }
        .join-shell { padding: 20px 16px; }
        .shell-fab { right: 16px; bottom: 16px; width: 52px; height: 52px; }
        .dashboard-grid { grid-template-columns: 1fr; }
        .dash-hero { grid-column: span 1; }
        .dash-link-form { grid-template-columns: 1fr; }
        .dash-card-head { flex-direction: column; align-items: flex-start; }
        .team-role-head { display: none; }
        .team-role-card { grid-template-columns: 1fr; }
        .task-modal-backdrop { padding: 12px; }
        .task-modal { width: 100%; max-height: 100vh; min-height: 0; border-radius: 20px; padding: 18px 16px; }
        .task-panel-top, .task-modal-actions { flex-direction: column; align-items: flex-start; }
        .task-field-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  )
}
