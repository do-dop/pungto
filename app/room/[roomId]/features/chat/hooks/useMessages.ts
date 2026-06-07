'use client'

import { useEffect, useRef, useState } from 'react'
import { loadMessages, sendRoomMessage, subscribeToMessages } from '../services/messageService'
import type { Message } from '../types'

type UseMessagesOptions = {
  roomId: string
  joined: boolean
  sessionId: string
  displayName: string
}

export function useMessages({ roomId, joined, sessionId, displayName }: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    if (!joined || !roomId) return

    let cancelled = false

    loadMessages(roomId)
      .then((nextMessages) => {
        if (!cancelled) setMessages(nextMessages)
      })
      .catch((error) => {
        console.error('Load messages error:', error)
      })

    const unsubscribe = subscribeToMessages(roomId, (message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [joined, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed) return

    try {
      await sendRoomMessage({
        roomId,
        sessionId,
        displayName: displayName.trim(),
        content: trimmed,
      })
      setInput('')
    } catch (error) {
      console.error('Send message error:', error)
    }
  }

  return {
    messages,
    input,
    setInput,
    bottomRef,
    chatScrollRef,
    composingRef,
    sendMessage,
  }
}
