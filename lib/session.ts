import { nanoid } from 'nanoid'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('session_id')
  if (!sid) {
    sid = nanoid()
    localStorage.setItem('session_id', sid)
  }
  return sid
}

export function getSavedName(): string {
  return localStorage.getItem('display_name') || ''
}

export function saveName(name: string) {
  localStorage.setItem('display_name', name)
}