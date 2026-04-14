'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSessionId, getSavedName, saveName } from '@/lib/session'
import { QRCodeSVG } from 'qrcode.react'

type Message = {
  id: string
  display_name: string
  content: string
  session_id: string
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const hh = d.getHours(), mm = d.getMinutes()
  const ampm = hh < 12 ? '오전' : '오후'
  const h = hh % 12 || 12
  return `${ampm} ${h}:${mm < 10 ? '0' : ''}${mm}`
}

// 아바타 색상 — 이름 첫 글자 기준으로 일관된 색상 부여
const AV_COLORS = ['av-p', 'av-t', 'av-c']
function getAvColor(name: string) {
  const idx = name.charCodeAt(0) % AV_COLORS.length
  return AV_COLORS[idx]
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const sessionId = getSessionId()
  const bottomRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    setMounted(true)
    const saved = getSavedName()
    if (saved) setName(saved)
  }, [])

  useEffect(() => {
    if (!joined) return

    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')
      .then(({ data }) => setMessages(data || []))

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe((status) => {
        console.log('Realtime:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [joined, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function join() {
    if (!name.trim()) return
    saveName(name.trim())
    await supabase.from('members').upsert({
      room_id: roomId,
      session_id: sessionId,
      display_name: name.trim(),
    }, { onConflict: 'room_id,session_id' })
    setJoined(true)
  }

  async function sendMessage() {
    if (!input.trim()) return
    await supabase.from('messages').insert({
      room_id: roomId,
      session_id: sessionId,
      display_name: name,
      content: input.trim(),
    })
    setInput('')
  }

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted) return null

  // ===== 이름 입력 화면 =====
  if (!joined) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', width: 300 }}>
          <div className="logo" style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Pungto</h2>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>이름만 입력하면 바로 시작해요</p>
          <input
            style={{
              width: '100%', border: '1px solid #e0ddd5', borderRadius: 12,
              padding: '10px 16px', fontSize: 15, textAlign: 'center',
              outline: 'none', background: '#faf9f7', color: '#1a1a1a',
              fontFamily: 'inherit', marginBottom: 10,
            }}
            placeholder="이름 또는 닉네임"
            value={name}
            onChange={e => setName(e.target.value)}
            onCompositionStart={() => { composingRef.current = true }}
            onCompositionEnd={() => { composingRef.current = false }}
            onKeyDown={e => { if (e.key === 'Enter' && !composingRef.current) join() }}
            autoFocus
          />
          <button
            onClick={join}
            style={{
              width: '100%', background: '#534AB7', color: '#fff',
              border: 'none', borderRadius: 12, padding: '10px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            입장
          </button>
        </div>
      </div>
    )
  }

  // ===== 채팅방 화면 =====
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="wrap">

        {/* 사이드바 */}
        <div className="sidebar">
          <div className="logo">⬡</div>
          <button className="nav-btn active" title="채팅">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <div className="nav-sep" />
          <button className="nav-btn" title="초대" onClick={() => setShowQR(!showQR)}>
            <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>

        {/* 메인 */}
        <div className="main">

          {/* 상단 바 */}
          <div className="topbar">
            <span className="page-title">채팅</span>
            <div className="url-pill" onClick={() => setShowQR(!showQR)}>
              <div className="green-dot" />
              <span>{`pungto.app/r/${roomId}`}</span>
            </div>
            <button className="btn-share" onClick={() => setShowQR(!showQR)}>
              링크 공유
            </button>
          </div>

          {/* QR 패널 */}
          {showQR && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid #e0ddd5', background: '#faf9f7' }}>
              <QRCodeSVG value={url} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>QR 또는 링크로 초대하세요</p>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#534AB7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</p>
                <button
                  onClick={copyLink}
                  style={{ marginTop: 8, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {copied ? '복사됨!' : '링크 복사'}
                </button>
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#ccc', fontSize: 13, marginTop: 32 }}>
                첫 메시지를 보내보세요!
              </p>
            )}
            {messages.map(msg => {
              const isMe = msg.session_id === sessionId
              return (
                <div key={msg.id} className={`msg${isMe ? ' me' : ''}`}>
                  <div className={`av ${getAvColor(msg.display_name)}`}>
                    {msg.display_name[0]}
                  </div>
                  <div className="bubble-wrap">
                    {!isMe && (
                      <span style={{ fontSize: 11, color: '#bbb' }}>{msg.display_name}</span>
                    )}
                    <div className="bubble">{msg.content}</div>
                    <div className="msg-meta">{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onKeyDown={e => { if (e.key === 'Enter' && !composingRef.current) sendMessage() }}
              autoComplete="off"
            />
            <button className="send-btn" onClick={sendMessage}>
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}