import { supabase } from '@/lib/supabase'
import type { DashboardLink, DashboardLinkRow, DashboardMetaRow, TeamRole, TeamRoleRow } from '../types'

export async function loadDashboardRows(roomId: string) {
  const [metaResult, linksResult, rolesResult] = await Promise.all([
    supabase.from('room_dashboard').select('*').eq('room_id', roomId).maybeSingle(),
    supabase.from('dashboard_links').select('*').eq('room_id', roomId).order('position', { ascending: true }),
    supabase.from('team_roles').select('*').eq('room_id', roomId).order('position', { ascending: true }),
  ])

  if (metaResult.error || linksResult.error || rolesResult.error) {
    throw {
      metaError: metaResult.error,
      linksError: linksResult.error,
      rolesError: rolesResult.error,
    }
  }

  return {
    meta: metaResult.data as DashboardMetaRow | null,
    links: (linksResult.data ?? []) as DashboardLinkRow[],
    roles: (rolesResult.data ?? []) as TeamRoleRow[],
  }
}

export async function upsertDashboardMeta(roomId: string, projectName: string, summary: string, goal: string) {
  const { data, error } = await supabase
    .from('room_dashboard')
    .upsert({ room_id: roomId, project_name: projectName, summary, goal }, { onConflict: 'room_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as DashboardMetaRow
}

export async function insertDashboardLinks(roomId: string, links: DashboardLink[]) {
  const seedLinks = links.map((link, index) => ({
    room_id: roomId,
    label: link.label,
    url: link.url,
    kind: link.kind,
    position: index,
  }))
  const { data, error } = await supabase
    .from('dashboard_links')
    .insert(seedLinks)
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []) as DashboardLinkRow[]
}

export async function insertDashboardLink(roomId: string, link: Omit<DashboardLink, 'id'>, position: number) {
  const { data, error } = await supabase
    .from('dashboard_links')
    .insert({
      room_id: roomId,
      label: link.label,
      url: link.url,
      kind: link.kind,
      position,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as DashboardLinkRow
}

export async function deleteDashboardLink(roomId: string, id: number) {
  const { error } = await supabase
    .from('dashboard_links')
    .delete()
    .eq('id', id)
    .eq('room_id', roomId)

  if (error) throw error
}

export async function insertTeamRoles(roomId: string, roles: TeamRole[]) {
  const seedRoles = roles.map((member, index) => ({
    room_id: roomId,
    name: member.name,
    role: member.role,
    position: index,
  }))
  const { data, error } = await supabase
    .from('team_roles')
    .insert(seedRoles)
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []) as TeamRoleRow[]
}

export async function insertTeamRole(roomId: string, position: number) {
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

  if (error) throw error
  return data as TeamRoleRow
}

export async function updateTeamRoleRow(roomId: string, role: TeamRole) {
  const { error } = await supabase
    .from('team_roles')
    .update({
      name: role.name,
      role: role.role,
    })
    .eq('id', role.id)
    .eq('room_id', roomId)

  if (error) throw error
}

export async function deleteTeamRole(roomId: string, id: number) {
  const { error } = await supabase
    .from('team_roles')
    .delete()
    .eq('id', id)
    .eq('room_id', roomId)

  if (error) throw error
}

export function subscribeToDashboard(roomId: string, onChange: (payload: {
  table: 'room_dashboard' | 'dashboard_links' | 'team_roles'
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: DashboardMetaRow | DashboardLinkRow | TeamRoleRow
  old?: DashboardLinkRow | TeamRoleRow
}) => void) {
  const channel = supabase
    .channel(`dashboard-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_dashboard', filter: `room_id=eq.${roomId}` },
      (payload) => {
        onChange({
          table: 'room_dashboard',
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as DashboardMetaRow,
        })
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dashboard_links', filter: `room_id=eq.${roomId}` },
      (payload) => {
        onChange({
          table: 'dashboard_links',
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as DashboardLinkRow,
          old: payload.old as DashboardLinkRow,
        })
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'team_roles', filter: `room_id=eq.${roomId}` },
      (payload) => {
        onChange({
          table: 'team_roles',
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as TeamRoleRow,
          old: payload.old as TeamRoleRow,
        })
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
