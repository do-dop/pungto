import type { CSSProperties } from 'react'
import type {
  DashboardLink,
  DashboardLinkRow,
  KanbanTask,
  ShellBackgroundKey,
  TaskRow,
  TeamRole,
  TeamRoleRow,
} from './types'
import { shellBackgroundOrder } from './constants'

export function mapTaskRow(row: TaskRow): KanbanTask {
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

export function buildTaskInsert(task: KanbanTask, roomId: string, sessionId: string, position: number) {
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

export function buildTaskUpdate(task: KanbanTask) {
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

export function mapDashboardLinkRow(row: DashboardLinkRow): DashboardLink {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    kind: row.kind,
  }
}

export function mapTeamRoleRow(row: TeamRoleRow): TeamRole {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
  }
}

export function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== 'object') return error

  const candidate = error as {
    code?: string
    message?: string
    details?: string
    hint?: string
  }

  return {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint,
  }
}

export function getShellBackgroundStyle(backgroundKey: ShellBackgroundKey): CSSProperties {
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

export function getNextShellBackground(backgroundKey: ShellBackgroundKey): ShellBackgroundKey {
  const currentIndex = shellBackgroundOrder.indexOf(backgroundKey)
  return shellBackgroundOrder[(currentIndex + 1) % shellBackgroundOrder.length]
}

export function formatTime(iso: string) {
  const d = new Date(iso)
  const hh = d.getHours()
  const mm = d.getMinutes()
  const ampm = hh < 12 ? '오전' : '오후'
  const h = hh % 12 || 12
  return `${ampm} ${h}:${mm < 10 ? '0' : ''}${mm}`
}

export function toDateInputValue(due: string) {
  if (!due || due === '완료' || due === '미정') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due

  const match = due.match(/(\d{1,2})\/(\d{1,2})/)
  if (!match) return ''

  const year = new Date().getFullYear()
  const month = match[1].padStart(2, '0')
  const day = match[2].padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDueLabel(due: string, isOverdue?: boolean) {
  if (!due) return '미정'
  if (due === '완료') return due
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const [, month, day] = due.split('-')
    return `${Number(month)}/${Number(day)}${isOverdue ? ' 마감 초과' : ''}`
  }
  return due
}

const AV_COLORS = ['av-p', 'av-t', 'av-c']
export function getAvColor(name: string) {
  const safe = name?.trim() || '익명'
  const idx = safe.charCodeAt(0) % AV_COLORS.length
  return AV_COLORS[idx]
}
