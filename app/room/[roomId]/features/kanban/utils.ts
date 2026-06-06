import type { KanbanTask, TaskRow } from './types'

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
