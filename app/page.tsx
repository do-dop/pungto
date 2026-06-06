'use client'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRoomWithPassword } from '@/lib/auth'

function getCreateRoomNotice(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message)
      : ''

  if (message.includes('Anonymous sign-ins are disabled') || message.includes('Anonymous signups are disabled')) {
    return 'Supabase Authentication에서 Anonymous Sign-Ins를 켜주세요.'
  }

  if (message.includes('create_room_with_password') || message.includes('Could not find the function')) {
    return 'Supabase SQL Editor에서 최신 create-room-access.sql을 먼저 실행해주세요.'
  }

  if (message.includes('Authentication required') || message.includes('JWT')) {
    return '익명 인증 세션을 만들지 못했습니다. Anonymous Sign-Ins 설정을 확인해주세요.'
  }

  if (message.includes('duplicate key') || message.includes('already exists')) {
    return '방 ID가 충돌했습니다. 다시 한 번 방 만들기를 눌러주세요.'
  }

  return message ? `방을 만들지 못했습니다: ${message}` : '방을 만들지 못했습니다. 잠시 후 다시 시도해주세요.'
}

export default function Home() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [roomTitle, setRoomTitle] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [notice, setNotice] = useState('')

  async function createRoom() {
    if (creating) return
    const title = roomTitle.trim()
    const password = roomPassword.trim()
    if (!title) {
      setNotice('방 이름을 입력해주세요.')
      return
    }

    if (password.length < 4) {
      setNotice('방 비밀번호는 4자 이상 입력해주세요.')
      return
    }

    setCreating(true)
    setNotice('')
    const roomId = nanoid(6)

    try {
      await createRoomWithPassword(roomId, title, password)
    } catch (error) {
      console.error('Create protected room error:', error)
      setNotice(getCreateRoomNotice(error))
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
            <span>비밀번호 입장</span>
          </div>
          <input
            className="landing-input"
            value={roomTitle}
            onChange={(event) => {
              setRoomTitle(event.target.value)
              setNotice('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void createRoom()
            }}
            placeholder="방 이름"
            autoComplete="off"
          />
          <input
            className="landing-input"
            type="password"
            value={roomPassword}
            onChange={(event) => {
              setRoomPassword(event.target.value)
              setNotice('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void createRoom()
            }}
            placeholder="방 비밀번호"
            autoComplete="new-password"
          />
          {notice && <p className="landing-notice">{notice}</p>}
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
        .landing-input {
          width: 100%;
          border: 1px solid #e7dfd3;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 10px;
          background: #fbf8f3;
          color: #1f1d2f;
          font: inherit;
          font-size: 14px;
          outline: none;
          text-align: center;
        }
        .landing-input:focus {
          border-color: #7f77dd;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(127, 119, 221, 0.14);
        }
        .landing-notice {
          margin: -2px 0 10px;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
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
