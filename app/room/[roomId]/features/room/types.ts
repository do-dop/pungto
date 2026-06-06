export type PageKey = 'dashboard' | 'chat' | 'kanban' | 'schedule' | 'docs' | 'notif' | 'todo'
export type ShellBackgroundKey = 'default' | 'rolophus'

export type TodoItem = {
  id: number
  text: string
  due: string
  urgent?: boolean
  done?: boolean
}

export type DocumentItem = {
  ext: string
  className: string
  name: string
  meta: string
}

export type NotificationItem = {
  tone: string
  title: string
  time: string
  unread?: boolean
}
