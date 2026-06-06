export type DashboardLink = {
  id: number
  label: string
  url: string
  kind: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
}

export type TeamRole = {
  id: number
  name: string
  role: string
}

export type DashboardMetaRow = {
  room_id: string
  project_name?: string
  summary: string
  goal: string
  updated_at: string
}

export type DashboardLinkRow = {
  id: number
  room_id: string
  label: string
  url: string
  kind: DashboardLink['kind']
  position: number
  created_at: string
}

export type TeamRoleRow = {
  id: number
  room_id: string
  name: string
  role: string
  position: number
  created_at: string
  updated_at: string
}
