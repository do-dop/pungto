import { supabase } from '@/lib/supabase'

export async function upsertDisplayMember(roomId: string, sessionId: string, displayName: string) {
  const { error } = await supabase.from('members').upsert(
    {
      room_id: roomId,
      session_id: sessionId,
      display_name: displayName,
    },
    { onConflict: 'room_id,session_id' }
  )

  if (error) throw error
}
