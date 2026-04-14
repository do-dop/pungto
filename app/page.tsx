'use client'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  async function createRoom() {
    const roomId = nanoid(6)
    await supabase.from('rooms').insert({ id: roomId, title: '새 방' })
    router.push(`/room/${roomId}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-indigo-600">Pungto</h1>
        <p className="text-gray-500">가입 없이 바로 시작하는 협업 공간</p>
        <button
          onClick={createRoom}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-indigo-500 transition"
        >
          방 만들기
        </button>
      </div>
    </main>
  )
}