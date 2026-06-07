import { supabase } from '@/lib/supabase'
import type { Message } from '../types'

type MessageInsert = {
  roomId: string
  sessionId: string
  displayName: string
  content: string
}

export async function loadMessages(roomId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at')

  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendRoomMessage({ roomId, sessionId, displayName, content }: MessageInsert) {
  const { error } = await supabase.from('messages').insert({
    room_id: roomId,
    session_id: sessionId,
    display_name: displayName,
    content,
  })

  if (error) throw error
}

export function subscribeToMessages(roomId: string, onInsert: (message: Message) => void) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onInsert(payload.new as Message)
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
