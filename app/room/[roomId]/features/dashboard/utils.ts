import type { DashboardLink, DashboardLinkRow, TeamRole, TeamRoleRow } from './types'

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
