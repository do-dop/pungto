import { supabase } from '@/lib/supabase'
import type { KanbanColumnKey, KanbanTask, TaskRow } from '../types'
import { buildTaskInsert, buildTaskUpdate } from '../utils'

export async function loadTaskRows(roomId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('room_id', roomId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as TaskRow[]
}

export async function seedTaskRows(roomId: string, sessionId: string, tasks: KanbanTask[]) {
  const seedRows = tasks.map((task, index) => buildTaskInsert(task, roomId, sessionId, index))
  const { data, error } = await supabase
    .from('tasks')
    .insert(seedRows)
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []) as TaskRow[]
}

export async function updateTaskRow(roomId: string, taskId: number, task: KanbanTask) {
  const { data, error } = await supabase
    .from('tasks')
    .update(buildTaskUpdate(task))
    .eq('id', taskId)
    .eq('room_id', roomId)
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('No rows updated. RLS policy may be blocking task updates.')
  }
}

export async function insertTaskRow(params: {
  roomId: string
  status: KanbanColumnKey
  position: number
  ownerName: string
  sessionId: string
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      room_id: params.roomId,
      title: '새 태스크',
      description: '',
      status: params.status,
      category: '기획',
      category_class: 'tag-p',
      owner_name: params.ownerName,
      due_text: '미정',
      is_overdue: false,
      position: params.position,
      created_by_session_id: params.sessionId,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as TaskRow
}

export async function deleteTaskRow(roomId: string, taskId: number) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('room_id', roomId)

  if (error) throw error
}

export function subscribeToTasks(roomId: string, onChange: (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: TaskRow
  old?: TaskRow
}) => void) {
  const channel = supabase
    .channel(`tasks-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as TaskRow | undefined,
          old: payload.old as TaskRow | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
