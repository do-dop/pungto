'use client'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function createRoom() {
    if (creating) return
    setCreating(true)
    const roomId = nanoid(6)

    const { error } = await supabase.from('rooms').insert({ id: roomId, title: '새 방' })
    if (error) {
      console.error('Create room error:', error)
      setCreating(false)
      return
    }

    router.push(`/room/${roomId}`)
  }

  return (
    <>
      <main className="landing-shell">
        <section className="landing-card">
          <div className="landing-badge">새 협업방</div>
          <div className="landing-logo">⬡</div>
          <h1 className="landing-title">Pungto</h1>
          <p className="landing-desc">이름만 입력하면 바로 시작하는 가벼운 협업 공간</p>
          <div className="landing-points">
            <span>실시간 채팅</span>
            <span>빠른 초대 링크</span>
            <span>가입 없이 시작</span>
          </div>
          <button
            onClick={createRoom}
            className="landing-btn"
            disabled={creating}
          >
            {creating ? '방 만드는 중...' : '방 만들기'}
          </button>
        </section>
      </main>
      <style jsx>{`
        .landing-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background:
            radial-gradient(circle at top, rgba(83, 74, 183, 0.1), transparent 30%),
            linear-gradient(180deg, #f7f3ee 0%, #f5f5f3 100%);
        }
        .landing-card {
          width: 100%;
          max-width: 360px;
          padding: 28px 24px 24px;
          border: 1px solid rgba(224, 221, 213, 0.95);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 24px 60px rgba(57, 50, 130, 0.08);
          text-align: center;
          backdrop-filter: blur(14px);
        }
        .landing-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f0effd;
          color: #534ab7;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 18px;
        }
        .landing-logo {
          width: 54px;
          height: 54px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: linear-gradient(135deg, #5c53c9 0%, #847ce3 100%);
          color: #fff;
          font-size: 24px;
          box-shadow: 0 14px 28px rgba(83, 74, 183, 0.22);
        }
        .landing-title {
          font-size: 28px;
          line-height: 1.1;
          font-weight: 700;
          color: #1f1d2f;
          margin-bottom: 8px;
        }
        .landing-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #7d7888;
          margin-bottom: 18px;
        }
        .landing-points {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .landing-points span {
          padding: 7px 11px;
          border-radius: 999px;
          background: #faf7f2;
          border: 1px solid #ebe5db;
          color: #686272;
          font-size: 12px;
        }
        .landing-btn {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #5a52c4 0%, #7f77dd 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(83, 74, 183, 0.22);
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }
        .landing-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 34px rgba(83, 74, 183, 0.28);
        }
        .landing-btn:disabled {
          cursor: default;
          opacity: 0.7;
        }
      `}</style>
    </>
  )
}
