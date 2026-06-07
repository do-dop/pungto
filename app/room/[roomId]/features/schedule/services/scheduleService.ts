import { supabase } from '@/lib/supabase'
import type { Schedule, ScheduleInput } from '../types'

export async function loadScheduleRows(roomId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('room_id', roomId)
    .order('scheduled_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Schedule[]
}

export async function insertScheduleRow(roomId: string, input: ScheduleInput, sessionId?: string | null) {
  const { data, error } = await supabase
    .from('schedules')
    .insert({
      room_id: roomId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      scheduled_date: input.scheduled_date,
      color: input.color,
      created_by: sessionId ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Schedule
}

export async function updateScheduleRow(roomId: string, id: string, input: ScheduleInput) {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      scheduled_date: input.scheduled_date,
      color: input.color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('room_id', roomId)
    .select('*')
    .single()

  if (error) throw error
  return data as Schedule
}

export async function deleteScheduleRow(roomId: string, id: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('room_id', roomId)

  if (error) throw error
}

export function subscribeToSchedules(roomId: string, onChange: (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST_DELETE'
  schedule?: Schedule
  deletedId?: string
  deletedRoomId?: string
}) => void) {
  const channel = supabase
    .channel(`schedules:${roomId}`)
    .on('broadcast', { event: 'schedule_deleted' }, ({ payload }) => {
      const deleted = payload as { id?: string; roomId?: string }
      onChange({
        eventType: 'BROADCAST_DELETE',
        deletedId: deleted.id,
        deletedRoomId: deleted.roomId,
      })
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'schedules',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onChange({ eventType: 'INSERT', schedule: payload.new as Schedule })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'schedules',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onChange({ eventType: 'UPDATE', schedule: payload.new as Schedule })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'schedules',
      },
      (payload) => {
        const deleted = payload.old as { id?: string; room_id?: string }
        onChange({
          eventType: 'DELETE',
          deletedId: deleted.id,
          deletedRoomId: deleted.room_id,
        })
      }
    )
    .subscribe()

  return {
    sendDeleteBroadcast: (id: string) => channel.send({
      type: 'broadcast',
      event: 'schedule_deleted',
      payload: { id, roomId },
    }),
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
