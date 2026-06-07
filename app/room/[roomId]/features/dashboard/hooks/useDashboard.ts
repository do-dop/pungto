'use client'

import { useEffect, useRef, useState } from 'react'
import {
  initialDashboardLinks,
  initialProjectGoal,
  initialProjectName,
  initialProjectSummary,
  initialTeamRoles,
} from '../constants'
import {
  deleteDashboardLink,
  deleteTeamRole,
  insertDashboardLink,
  insertDashboardLinks,
  insertTeamRole,
  insertTeamRoles,
  loadDashboardRows,
  subscribeToDashboard,
  updateTeamRoleRow,
  upsertDashboardMeta,
} from '../services/dashboardService'
import type { DashboardLink, DashboardLinkRow, DashboardMetaRow, TeamRole, TeamRoleRow } from '../types'
import { mapDashboardLinkRow, mapTeamRoleRow } from '../utils'
import { formatSupabaseError } from '../../room/utils'

export function useDashboard(roomId: string, joined: boolean) {
  const [projectName, setProjectName] = useState(initialProjectName)
  const [projectSummary, setProjectSummary] = useState(initialProjectSummary)
  const [projectGoal, setProjectGoal] = useState(initialProjectGoal)
  const [dashboardLinks, setDashboardLinks] = useState<DashboardLink[]>(initialDashboardLinks)
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [linkLabelInput, setLinkLabelInput] = useState('')
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkKindInput, setLinkKindInput] = useState<DashboardLink['kind']>('github')
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>(initialTeamRoles)
  const dashboardMetaSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const teamRoleSaveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!joined || !roomId) return

    let cancelled = false

    async function loadDashboard() {
      try {
        const { meta, links, roles } = await loadDashboardRows(roomId)

        if (!meta) {
          const seededMeta = await upsertDashboardMeta(roomId, initialProjectName, initialProjectSummary, initialProjectGoal)
          if (!cancelled) {
            setProjectName(seededMeta.project_name || initialProjectName)
            setProjectSummary(seededMeta.summary)
            setProjectGoal(seededMeta.goal)
          }
        } else if (!cancelled) {
          setProjectName(meta.project_name || initialProjectName)
          setProjectSummary(meta.summary)
          setProjectGoal(meta.goal)
        }

        if (links.length === 0 && !cancelled) {
          const insertedLinks = await insertDashboardLinks(roomId, initialDashboardLinks)
          setDashboardLinks(insertedLinks.map(mapDashboardLinkRow))
        } else if (!cancelled) {
          setDashboardLinks(links.map(mapDashboardLinkRow))
        }

        if (roles.length === 0 && !cancelled) {
          const insertedRoles = await insertTeamRoles(roomId, initialTeamRoles)
          setTeamRoles(insertedRoles.map(mapTeamRoleRow))
        } else if (!cancelled) {
          setTeamRoles(roles.map(mapTeamRoleRow))
        }

        if (!cancelled) setDashboardNotice('')
      } catch (error) {
        console.error('Load dashboard error:', formatSupabaseError(error))
        if (!cancelled) setDashboardNotice('대시보드를 불러오지 못했어요')
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [joined, roomId])

  useEffect(() => {
    if (!joined || !roomId) return

    return subscribeToDashboard(roomId, (payload) => {
      if (payload.table === 'room_dashboard' && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        const row = payload.new as DashboardMetaRow
        setProjectName(row.project_name || initialProjectName)
        setProjectSummary(row.summary)
        setProjectGoal(row.goal)
        return
      }

      if (payload.table === 'dashboard_links') {
        if (payload.eventType === 'INSERT' && payload.new) {
          const nextLink = mapDashboardLinkRow(payload.new as DashboardLinkRow)
          setDashboardLinks((prev) => prev.some((link) => link.id === nextLink.id) ? prev : [...prev, nextLink])
          return
        }
        if (payload.eventType === 'UPDATE' && payload.new) {
          const nextLink = mapDashboardLinkRow(payload.new as DashboardLinkRow)
          setDashboardLinks((prev) => prev.map((link) => link.id === nextLink.id ? nextLink : link))
          return
        }
        if (payload.eventType === 'DELETE' && payload.old) {
          const oldRow = payload.old as DashboardLinkRow
          setDashboardLinks((prev) => prev.filter((link) => link.id !== oldRow.id))
        }
      }

      if (payload.table === 'team_roles') {
        if (payload.eventType === 'INSERT' && payload.new) {
          const nextRole = mapTeamRoleRow(payload.new as TeamRoleRow)
          setTeamRoles((prev) => prev.some((member) => member.id === nextRole.id) ? prev : [...prev, nextRole])
          return
        }
        if (payload.eventType === 'UPDATE' && payload.new) {
          const nextRole = mapTeamRoleRow(payload.new as TeamRoleRow)
          setTeamRoles((prev) => prev.map((member) => member.id === nextRole.id ? nextRole : member))
          return
        }
        if (payload.eventType === 'DELETE' && payload.old) {
          const oldRow = payload.old as TeamRoleRow
          setTeamRoles((prev) => prev.filter((member) => member.id !== oldRow.id))
        }
      }
    })
  }, [joined, roomId])

  useEffect(() => {
    const teamRoleTimers = teamRoleSaveTimersRef.current
    return () => {
      Object.values(teamRoleTimers).forEach((timer) => clearTimeout(timer))
      if (dashboardMetaSaveTimerRef.current) clearTimeout(dashboardMetaSaveTimerRef.current)
    }
  }, [])

  function scheduleDashboardMetaSave(nextProjectName: string, nextSummary: string, nextGoal: string) {
    if (dashboardMetaSaveTimerRef.current) clearTimeout(dashboardMetaSaveTimerRef.current)
    setDashboardNotice('대시보드 자동 저장 중...')
    dashboardMetaSaveTimerRef.current = setTimeout(async () => {
      try {
        await upsertDashboardMeta(roomId, nextProjectName, nextSummary, nextGoal)
        setDashboardNotice('대시보드가 저장됐어요')
        setTimeout(() => {
          setDashboardNotice((current) => current === '대시보드가 저장됐어요' ? '' : current)
        }, 2000)
      } catch (error) {
        console.error('Save room_dashboard error:', error)
        setDashboardNotice('대시보드 저장에 실패했어요')
      }
    }, 450)
  }

  function updateProjectName(nextValue: string) {
    setProjectName(nextValue)
    scheduleDashboardMetaSave(nextValue, projectSummary, projectGoal)
  }

  function updateProjectSummary(nextValue: string) {
    setProjectSummary(nextValue)
    scheduleDashboardMetaSave(projectName, nextValue, projectGoal)
  }

  function updateProjectGoal(nextValue: string) {
    setProjectGoal(nextValue)
    scheduleDashboardMetaSave(projectName, projectSummary, nextValue)
  }

  async function addDashboardLink() {
    const label = linkLabelInput.trim()
    const urlValue = linkUrlInput.trim()
    if (!label || !urlValue) return

    const normalizedUrl = /^https?:\/\//.test(urlValue) ? urlValue : `https://${urlValue}`
    setDashboardNotice('링크를 추가하는 중...')

    try {
      const row = await insertDashboardLink(roomId, {
        label,
        url: normalizedUrl,
        kind: linkKindInput,
      }, dashboardLinks.length)
      setDashboardLinks((prev) => [...prev, mapDashboardLinkRow(row)])
      setLinkLabelInput('')
      setLinkUrlInput('')
      setLinkKindInput('github')
      setDashboardNotice('링크가 저장됐어요')
    } catch (error) {
      console.error('Add dashboard link error:', error)
      setDashboardNotice('링크 추가에 실패했어요')
    }
  }

  async function removeDashboardLink(id: number) {
    try {
      await deleteDashboardLink(roomId, id)
      setDashboardLinks((prev) => prev.filter((link) => link.id !== id))
    } catch (error) {
      console.error('Delete dashboard link error:', error)
      setDashboardNotice('링크 삭제에 실패했어요')
    }
  }

  async function persistTeamRole(role: TeamRole) {
    try {
      await updateTeamRoleRow(roomId, role)
      setDashboardNotice('팀원 정보가 저장됐어요')
      setTimeout(() => {
        setDashboardNotice((current) => current === '팀원 정보가 저장됐어요' ? '' : current)
      }, 2000)
    } catch (error) {
      console.error('Update team role error:', error)
      setDashboardNotice('팀원 정보 저장에 실패했어요')
    }
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
    try {
      const row = await insertTeamRole(roomId, teamRoles.length)
      setTeamRoles((prev) => [...prev, mapTeamRoleRow(row)])
    } catch (error) {
      console.error('Add team role error:', error)
      setDashboardNotice('팀원 추가에 실패했어요')
    }
  }

  async function removeTeamRole(id: number) {
    if (teamRoleSaveTimersRef.current[id]) {
      clearTimeout(teamRoleSaveTimersRef.current[id])
      delete teamRoleSaveTimersRef.current[id]
    }

    try {
      await deleteTeamRole(roomId, id)
      setTeamRoles((prev) => prev.filter((member) => member.id !== id))
    } catch (error) {
      console.error('Delete team role error:', error)
      setDashboardNotice('팀원 삭제에 실패했어요')
    }
  }

  return {
    dashboardNotice,
    projectName,
    projectSummary,
    projectGoal,
    dashboardLinks,
    linkKindInput,
    linkLabelInput,
    linkUrlInput,
    teamRoles,
    setLinkKindInput,
    setLinkLabelInput,
    setLinkUrlInput,
    updateProjectName,
    updateProjectSummary,
    updateProjectGoal,
    addDashboardLink,
    removeDashboardLink,
    addTeamRole,
    updateTeamRole,
    removeTeamRole,
  }
}
