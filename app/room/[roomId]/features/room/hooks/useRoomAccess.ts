'use client'

import { useEffect, useRef, useState } from 'react'
import { getRoomTitle, joinRoomWithPassword } from '@/lib/auth'
import { getSavedName, saveName } from '@/lib/session'
import { upsertDisplayMember } from '../services/memberService'

export function useRoomAccess(roomId: string, sessionId: string) {
  const [name, setName] = useState(() => (typeof window === 'undefined' ? '' : getSavedName()))
  const [joined, setJoined] = useState(false)
  const [roomTitle, setRoomTitle] = useState('Pungto')
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [roomPassword, setRoomPassword] = useState('')
  const [joinNotice, setJoinNotice] = useState('')
  const composingRef = useRef(false)

  useEffect(() => {
    if (!roomId) return

    let cancelled = false

    getRoomTitle(roomId)
      .then((title) => {
        if (!cancelled) setRoomTitle(title)
      })
      .catch((error) => {
        console.error('Load room title error:', error)
      })

    return () => {
      cancelled = true
    }
  }, [roomId])

  async function join() {
    const trimmed = name.trim()
    if (!trimmed) return
    const password = roomPassword.trim()
    if (!password) {
      setJoinNotice('방 비밀번호를 입력해주세요')
      return
    }

    try {
      const user = await joinRoomWithPassword(roomId, password, trimmed)
      saveName(trimmed)
      await upsertDisplayMember(roomId, sessionId, trimmed)
      setAuthUserId(user.id)
      setJoinNotice('')
      setJoined(true)
    } catch (error) {
      console.error('Join room error:', error)
      setJoinNotice('비밀번호가 맞지 않거나 방에 입장할 수 없습니다')
    }
  }

  function startComposition() {
    composingRef.current = true
  }

  function endComposition() {
    composingRef.current = false
  }

  function isComposing() {
    return composingRef.current
  }

  return {
    name,
    setName,
    joined,
    roomTitle,
    authUserId,
    roomPassword,
    setRoomPassword,
    joinNotice,
    setJoinNotice,
    startComposition,
    endComposition,
    isComposing,
    join,
  }
}
