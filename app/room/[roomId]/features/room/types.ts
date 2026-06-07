export type PageKey = 'dashboard' | 'chat' | 'kanban' | 'schedule' | 'docs' | 'notif' | 'todo'
export type ShellBackgroundKey = 'default' | 'rolophus'

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
