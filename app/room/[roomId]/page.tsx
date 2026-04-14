'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { getSessionId, getSavedName, saveName } from '@/lib/session'

type Message = {
  id: string
  display_name: string
  content: string
  session_id: string
  created_at: string
}

type PageKey = 'chat' | 'kanban' | 'schedule' | 'docs' | 'notif' | 'todo'

type TodoItem = {
  id: number
  text: string
  due: string
  urgent?: boolean
  done?: boolean
}

const pageTitles: Record<PageKey, string> = {
  chat: '채팅',
  kanban: '프로젝트 — 칸반 보드',
  schedule: '프로젝트 — 일정',
  docs: '자료',
  notif: '알림',
  todo: '할 일',
}

const kanbanData = {
  todo: [
    { title: '경쟁사 UI 벤치마킹', tag: '기획', tagClass: 'tag-p', due: '~ 4/18' },
    { title: '사용자 인터뷰 설계', tag: '리서치', tagClass: 'tag-t', due: '~ 4/20' },
    { title: '랜딩 페이지 카피 작성', tag: '마케팅', tagClass: 'tag-a', due: '~ 4/12 마감 초과', overdue: true },
  ],
  doing: [
    { title: '프로토타입 1차 개발', tag: '개발', tagClass: 'tag-p', due: '~ 4/22' },
    { title: '기획서 v2 작성', tag: '기획', tagClass: 'tag-t', due: '~ 4/19' },
  ],
  review: [
    { title: '디자인 시스템 정의', tag: '디자인', tagClass: 'tag-a', due: '~ 4/16' },
  ],
  done: [
    { title: '프로젝트 킥오프 미팅', tag: '기획', tagClass: 'tag-t' },
    { title: '팀 온보딩 문서 공유', tag: '기획', tagClass: 'tag-p' },
  ],
}

const docsData = [
  { ext: 'DOC', className: 'di-doc', name: 'Q2 기획서 v2', meta: '방금 수정됨' },
  { ext: 'DOC', className: 'di-doc', name: '온보딩 가이드', meta: '3일 전 수정됨' },
  { ext: 'PDF', className: 'di-pdf', name: '경쟁사 분석 보고서', meta: '이수연 · 1주 전' },
  { ext: 'IMG', className: 'di-img', name: '디자인 시스템 v1', meta: '김정현 · 2일 전' },
  { ext: 'XLS', className: 'di-xls', name: '예산 계획서', meta: '나 · 4일 전' },
  { ext: 'DOC', className: 'di-doc', name: '회의록 4/7', meta: '김정현 · 7일 전' },
]

const notifications = [
  { tone: 'ni-r', title: '<b>랜딩 페이지 카피</b> 마감이 지났어요', time: '30분 전', unread: true },
  { tone: 'ni-p', title: '<b>이수연</b>이 채팅에 메시지를 남겼어요', time: '1시간 전', unread: true },
  { tone: 'ni-a', title: '오늘 오후 3시 <b>팀 위클리</b> 일정이 있어요', time: '2시간 전', unread: true },
  { tone: 'ni-t', title: '<b>김정현</b>이 디자인 시스템 v1 파일을 업로드했어요', time: '어제 오후 4:12' },
  { tone: 'ni-p', title: '<b>프로토타입 1차 개발</b> 카드가 진행 중으로 이동됐어요', time: '어제 오전 11:30' },
]

const initialTodos: TodoItem[] = [
  { id: 1, text: '랜딩 페이지 카피 초안 완성', due: '오늘 마감', urgent: true },
  { id: 2, text: '팀 위클리 준비 — 주간 요약 작성', due: '오늘 오후 2시', urgent: true },
  { id: 3, text: '기획서 v2 공유', due: '완료', done: true },
  { id: 4, text: '경쟁사 UI 벤치마킹 리포트', due: '4/18' },
  { id: 5, text: '사용자 인터뷰 설계서 작성', due: '4/20' },
  { id: 6, text: '디자인 시스템 검토 참석', due: '4/16' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const hh = d.getHours()
  const mm = d.getMinutes()
  const ampm = hh < 12 ? '오전' : '오후'
  const h = hh % 12 || 12
  return `${ampm} ${h}:${mm < 10 ? '0' : ''}${mm}`
}

const AV_COLORS = ['av-p', 'av-t', 'av-c']
function getAvColor(name: string) {
  const safe = name?.trim() || '익명'
  const idx = safe.charCodeAt(0) % AV_COLORS.length
  return AV_COLORS[idx]
}

function NavIcon({ type }: { type: PageKey }) {
  if (type === 'chat') return <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (type === 'kanban') return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/></svg>
  if (type === 'schedule') return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (type === 'docs') return <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
  if (type === 'notif') return <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  return <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [activePage, setActivePage] = useState<PageKey>('chat')
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [todoInput, setTodoInput] = useState('')
  const sessionId = getSessionId()
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const todoComposingRef = useRef(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    setMounted(true)
    const saved = getSavedName()
    if (saved) setName(saved)
  }, [])

  useEffect(() => {
    if (!joined || !roomId) return

    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          console.error('Load messages error:', error)
          return
        }
        setMessages(data || [])
      })

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
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe((status) => {
        console.log('Realtime:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [joined, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function join() {
    const trimmed = name.trim()
    if (!trimmed) return

    saveName(trimmed)
    const { error } = await supabase.from('members').upsert(
      {
        room_id: roomId,
        session_id: sessionId,
        display_name: trimmed,
      },
      { onConflict: 'room_id,session_id' }
    )

    if (error) {
      console.error('Join error:', error)
      return
    }

    setJoined(true)
  }

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed) return

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      session_id: sessionId,
      display_name: name.trim(),
      content: trimmed,
    })

    if (error) {
      console.error('Send message error:', error)
      return
    }

    setInput('')
  }

  function addTodo() {
    const trimmed = todoInput.trim()
    if (!trimmed) return
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, due: '미정' }])
    setTodoInput('')
  }

  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((item) => {
      if (item.id !== id) return item
      if (item.done) {
        return {
          ...item,
          done: false,
          due: item.text.includes('랜딩') ? '오늘 마감' : item.text.includes('팀 위클리') ? '오늘 오후 2시' : item.due === '완료' ? '미정' : item.due,
          urgent: item.text.includes('랜딩') || item.text.includes('팀 위클리'),
        }
      }
      return { ...item, done: true, due: '완료', urgent: false }
    }))
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (!mounted) return null

  if (!joined) {
    return (
      <>
        <div className="join-shell">
          <div className="join-card">
            <div className="logo join-logo">⬡</div>
            <h2 className="join-title">Pungto</h2>
            <p className="join-desc">이름만 입력하면 바로 시작해요</p>
            <input
              className="join-input"
              placeholder="이름 또는 닉네임"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !composingRef.current) join()
              }}
              autoFocus
            />
            <button className="join-btn" onClick={join}>입장</button>
          </div>
        </div>
        <GlobalStyles />
      </>
    )
  }

  return (
    <>
      <div className="page-shell">
        <div className="wrap">
          <aside className="sidebar">
            <div className="logo">⬡</div>
            {(['chat', 'kanban', 'schedule', 'docs'] as PageKey[]).map((key) => (
              <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => setActivePage(key)} title={pageTitles[key]}>
                <NavIcon type={key} />
              </button>
            ))}
            <div className="nav-sep" />
            {(['notif', 'todo'] as PageKey[]).map((key) => (
              <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => setActivePage(key)} title={pageTitles[key]}>
                {key === 'notif' ? <div className="badge" /> : null}
                <NavIcon type={key} />
              </button>
            ))}
          </aside>

          <main className="main">
            <div className="topbar">
              <span className="page-title">{pageTitles[activePage]}</span>
              <div className="url-pill" onClick={() => setShowQR((prev) => !prev)}>
                <div className="green-dot" />
                <span>{`pungto.app/r/${roomId}`}</span>
              </div>
              <button className="btn-share" onClick={() => setShowQR((prev) => !prev)}>링크 공유</button>
            </div>

            {showQR && (
              <div className="share-panel">
                <QRCodeSVG value={url} size={72} />
                <div className="share-info">
                  <p className="share-label">QR 또는 링크로 초대하세요</p>
                  <p className="share-url">{url}</p>
                  <button className="copy-btn" onClick={copyLink}>{copied ? '복사됨!' : '링크 복사'}</button>
                </div>
              </div>
            )}

            <div className="content">
              {activePage === 'chat' && (
                <div className="page active chat-page">
                  <div className="chat-messages" ref={chatScrollRef}>
                    {messages.length === 0 && <p className="empty-chat">아직 메시지가 없어요. 첫 메시지를 보내보세요!</p>}
                    {messages.map((msg) => {
                      const isMe = msg.session_id === sessionId
                      const safeName = msg.display_name?.trim() || '익명'
                      return (
                        <div key={msg.id} className={`msg${isMe ? ' me' : ''}`}>
                          <div className={`av ${getAvColor(safeName)}`}>{safeName[0]}</div>
                          <div className="bubble-wrap">
                            {!isMe && <span className="sender-name">{safeName}</span>}
                            <div className="bubble">{msg.content}</div>
                            <div className="msg-meta">{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <div className="chat-input-row sticky-input">
                    <input
                      className="chat-input"
                      placeholder="메시지를 입력하세요..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onCompositionStart={() => { composingRef.current = true }}
                      onCompositionEnd={() => { composingRef.current = false }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !composingRef.current) sendMessage()
                      }}
                      autoComplete="off"
                    />
                    <button className="send-btn" onClick={sendMessage}>
                      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {activePage === 'kanban' && (
                <div className="page active">
                  <div className="kanban">
                    <div className="k-col">
                      <div className="k-col-title">할 일 <span className="k-count">{kanbanData.todo.length}</span></div>
                      {kanbanData.todo.map((card) => (
                        <div className="k-card" key={card.title}>
                          <div className="k-card-title">{card.title}</div>
                          <span className={`k-tag ${card.tagClass}`}>{card.tag}</span>
                          <div className={`k-due ${card.overdue ? 'overdue' : ''}`}>{card.due}</div>
                        </div>
                      ))}
                      <button className="k-add">+ 카드 추가</button>
                    </div>
                    <div className="k-col">
                      <div className="k-col-title">진행 중 <span className="k-count">{kanbanData.doing.length}</span></div>
                      {kanbanData.doing.map((card) => (
                        <div className="k-card" key={card.title}>
                          <div className="k-card-title">{card.title}</div>
                          <span className={`k-tag ${card.tagClass}`}>{card.tag}</span>
                          <div className="k-due">{card.due}</div>
                        </div>
                      ))}
                      <button className="k-add">+ 카드 추가</button>
                    </div>
                    <div className="k-col">
                      <div className="k-col-title">검토 중 <span className="k-count">{kanbanData.review.length}</span></div>
                      {kanbanData.review.map((card) => (
                        <div className="k-card" key={card.title}>
                          <div className="k-card-title">{card.title}</div>
                          <span className={`k-tag ${card.tagClass}`}>{card.tag}</span>
                          <div className="k-due">{card.due}</div>
                        </div>
                      ))}
                      <button className="k-add">+ 카드 추가</button>
                    </div>
                    <div className="k-col">
                      <div className="k-col-title">완료 <span className="k-count">{kanbanData.done.length}</span></div>
                      {kanbanData.done.map((card) => (
                        <div className="k-card faded" key={card.title}>
                          <div className="k-card-title">{card.title}</div>
                          <span className={`k-tag ${card.tagClass}`}>{card.tag}</span>
                        </div>
                      ))}
                      <button className="k-add">+ 카드 추가</button>
                    </div>
                  </div>
                </div>
              )}

              {activePage === 'schedule' && (
                <div className="page active">
                  <div className="sched-header">
                    <button className="nav-arrow">‹</button>
                    <span className="sched-month">2026년 4월</span>
                    <button className="nav-arrow">›</button>
                  </div>
                  <div className="cal-grid">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d} className="cal-day-label">{d}</div>)}
                    {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day, index) => (
                      <div key={index} className={`cal-cell ${day === 14 ? 'today' : ''}`}>
                        <div className={`day-num ${index < 2 ? 'muted-day' : ''}`}>{day}</div>
                        {day === 7 && <div className="cal-event">킥오프 미팅</div>}
                        {day === 10 && <div className="cal-event teal">기획서 v1</div>}
                        {day === 14 && <div className="cal-event">팀 위클리</div>}
                        {day === 16 && <div className="cal-event coral">디자인 검토</div>}
                        {day === 22 && <div className="cal-event">프로토타입 데모</div>}
                        {day === 29 && <div className="cal-event teal">스프린트 회고</div>}
                      </div>
                    ))}
                  </div>
                  <div className="sched-list">
                    <div className="sched-item"><div className="sched-dot purple"></div><div className="sched-info"><div className="sched-title">팀 위클리</div><div className="sched-meta">오늘 · 오후 3:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot coral"></div><div className="sched-info"><div className="sched-title">디자인 시스템 검토</div><div className="sched-meta">4월 16일 · 오전 11:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot purple"></div><div className="sched-info"><div className="sched-title">프로토타입 데모</div><div className="sched-meta">4월 22일 · 오후 2:00</div></div></div>
                    <div className="sched-item"><div className="sched-dot teal"></div><div className="sched-info"><div className="sched-title">스프린트 회고</div><div className="sched-meta">4월 29일 · 오후 5:00</div></div></div>
                  </div>
                </div>
              )}

              {activePage === 'docs' && (
                <div className="page active">
                  <div className="docs-toolbar">
                    <input className="search-input" placeholder="파일 검색..." />
                    <button className="btn-upload">+ 업로드</button>
                  </div>
                  <div className="docs-grid">
                    {docsData.map((doc) => (
                      <div className="doc-card" key={doc.name}>
                        <div className={`doc-icon ${doc.className}`}>{doc.ext}</div>
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">{doc.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePage === 'notif' && (
                <div className="page active">
                  <div className="notif-section-label">오늘</div>
                  <div className="notif-list">
                    {notifications.map((item, index) => (
                      <div key={index}>
                        {index === 3 && <div className="notif-section-label nested">어제</div>}
                        <div className="notif-item">
                          <div className={`notif-icon ${item.tone}`} />
                          <div className="notif-body">
                            <div className="notif-title" dangerouslySetInnerHTML={{ __html: item.title }} />
                            <div className="notif-time">{item.time}</div>
                          </div>
                          {item.unread ? <div className="unread-dot" /> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePage === 'todo' && (
                <div className="page active todo-page">
                  <div className="todo-section-label">오늘 할 일</div>
                  <div className="todo-list">
                    {todos.map((todo, index) => (
                      <div key={todo.id}>
                        {index === 3 && <div className="todo-section-label nested-todo">이번 주</div>}
                        <div className="todo-item">
                          <button className={`todo-check ${todo.done ? 'done' : ''}`} onClick={() => toggleTodo(todo.id)} />
                          <span className={`todo-text ${todo.done ? 'done' : ''}`}>{todo.text}</span>
                          <span className={`todo-due ${todo.urgent && !todo.done ? 'urgent' : ''}`}>{todo.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="todo-add-row">
                    <input
                      className="todo-add-input"
                      value={todoInput}
                      onChange={(e) => setTodoInput(e.target.value)}
                      onCompositionStart={() => { todoComposingRef.current = true }}
                      onCompositionEnd={() => { todoComposingRef.current = false }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !todoComposingRef.current) addTodo()
                      }}
                      placeholder="할 일을 입력하세요..."
                    />
                    <button className="btn-add" onClick={addTodo}>추가</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <GlobalStyles />
    </>
  )
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body {
        font-family: 'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif;
        background: #f5f5f3;
      }
      .join-shell, .page-shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: #f5f5f3;
      }
      .join-card { width: 100%; max-width: 320px; text-align: center; }
      .join-logo { font-size: 28px; margin-bottom: 8px; }
      .join-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
      .join-desc { font-size: 13px; color: #aaa; margin-bottom: 24px; }
      .join-input {
        width: 100%; border: 1px solid #e0ddd5; border-radius: 12px; padding: 10px 16px; font-size: 15px;
        text-align: center; outline: none; background: #faf9f7; color: #1a1a1a; font-family: inherit; margin-bottom: 10px;
      }
      .join-btn {
        width: 100%; background: #534ab7; color: #fff; border: none; border-radius: 12px; padding: 10px 0;
        font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
      }
      .wrap {
        display: flex; width: 100%; max-width: 960px; height: 720px; border: 1px solid #e0ddd5; border-radius: 16px;
        overflow: hidden; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      }
      .sidebar {
        width: 52px; border-right: 1px solid #e0ddd5; display: flex; flex-direction: column; align-items: center;
        padding: 12px 0; gap: 4px; background: #faf9f7; flex-shrink: 0;
      }
      .logo { font-size: 20px; color: #534AB7; margin-bottom: 8px; font-weight: 700; line-height: 1; }
      .nav-btn {
        width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; cursor: pointer;
        display: flex; align-items: center; justify-content: center; position: relative; transition: background 0.15s;
      }
      .nav-btn:hover { background: #f0eff8; }
      .nav-btn.active { background: #EEEDFE; }
      .nav-btn svg {
        width: 18px; height: 18px; stroke: #888; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
        transition: stroke 0.15s;
      }
      .nav-btn.active svg { stroke: #534AB7; }
      .badge {
        position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; background: #E24B4A; border-radius: 50%; border: 1.5px solid #faf9f7;
      }
      .nav-sep { width: 24px; height: 1px; background: #e0ddd5; margin: 4px 0; }
      .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
      .topbar {
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .page-title { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
      .url-pill {
        display: flex; align-items: center; gap: 5px; background: #f5f5f3; border: 1px solid #e0ddd5; border-radius: 20px;
        padding: 4px 10px; font-size: 11px; color: #888; cursor: pointer; transition: border-color 0.15s;
      }
      .url-pill:hover { border-color: #bbb; }
      .green-dot { width: 5px; height: 5px; background: #1D9E75; border-radius: 50%; flex-shrink: 0; }
      .btn-share {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;
      }
      .btn-share:hover { background: #7F77DD; }
      .share-panel {
        display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #e0ddd5; background: #faf9f7; flex-shrink: 0;
      }
      .share-info { flex: 1; min-width: 0; }
      .share-label { font-size: 11px; color: #aaa; margin-bottom: 4px; }
      .share-url {
        font-size: 11px; font-family: monospace; color: #534AB7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .copy-btn {
        margin-top: 8px; background: #534AB7; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-family: inherit;
      }
      .content { flex: 1; overflow: hidden; min-height: 0; }
      .page { height: 100%; overflow: hidden; }
      .page.active { display: flex; flex-direction: column; min-height: 0; }
      .chat-page, .todo-page { min-height: 0; }
      .chat-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; min-height: 0;
      }
      .sticky-input { flex-shrink: 0; position: sticky; bottom: 0; z-index: 2; }
      .empty-chat { text-align: center; color: #ccc; font-size: 13px; margin-top: 32px; }
      .msg { display: flex; gap: 10px; align-items: flex-end; }
      .msg.me { flex-direction: row-reverse; }
      .av {
        width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0;
      }
      .av-p { background: #CECBF6; color: #3C3489; }
      .av-t { background: #9FE1CB; color: #085041; }
      .av-c { background: #F5C4B3; color: #712B13; }
      .bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: 68%; }
      .msg.me .bubble-wrap { align-items: flex-end; }
      .sender-name { font-size: 11px; color: #bbb; }
      .bubble {
        background: #f5f5f3; border-radius: 12px 12px 12px 3px; padding: 8px 12px; font-size: 13px; line-height: 1.6; color: #1a1a1a; word-break: break-all;
      }
      .msg.me .bubble { background: #EEEDFE; color: #26215C; border-radius: 12px 12px 3px 12px; }
      .msg-meta { font-size: 11px; color: #bbb; }
      .chat-input-row {
        display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; background: #fff;
      }
      .chat-input, .search-input, .todo-add-input {
        outline: none; font-family: inherit;
      }
      .chat-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 20px; padding: 8px 14px; font-size: 13px; background: #faf9f7; color: #1a1a1a; transition: border-color 0.15s;
      }
      .chat-input:focus, .search-input:focus, .todo-add-input:focus { border-color: #7F77DD; background: #fff; }
      .send-btn {
        width: 34px; height: 34px; background: #534AB7; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
      }
      .send-btn:hover { background: #7F77DD; }
      .send-btn svg { width: 14px; height: 14px; fill: #fff; stroke: #fff; stroke-width: 1.5; }
      .kanban { display: flex; gap: 12px; padding: 16px; overflow-x: auto; height: 100%; align-items: flex-start; }
      .k-col {
        flex: 0 0 195px; background: #faf9f7; border-radius: 12px; border: 1px solid #e0ddd5; padding: 12px; display: flex; flex-direction: column; gap: 8px;
      }
      .k-col-title { font-size: 12px; font-weight: 600; color: #888; display: flex; align-items: center; justify-content: space-between; }
      .k-count { background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 1px 7px; font-size: 11px; color: #aaa; }
      .k-card { background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 10px 12px; cursor: pointer; }
      .k-card:hover { border-color: #bbb; }
      .k-card.faded { opacity: 0.55; }
      .k-card-title { font-size: 13px; color: #1a1a1a; margin-bottom: 7px; line-height: 1.4; }
      .k-tag { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 500; }
      .tag-p { background: #EEEDFE; color: #3C3489; }
      .tag-t { background: #E1F5EE; color: #085041; }
      .tag-a { background: #FAEEDA; color: #633806; }
      .k-due { font-size: 11px; color: #aaa; margin-top: 6px; }
      .k-due.overdue { color: #A32D2D; font-weight: 500; }
      .k-add {
        width: 100%; background: transparent; border: 1px dashed #e0ddd5; border-radius: 10px; padding: 7px; font-size: 12px; color: #bbb; cursor: pointer; font-family: inherit;
      }
      .k-add:hover { background: #fff; color: #888; border-color: #bbb; }
      .sched-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 10px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .sched-month { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
      .nav-arrow {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 3px 9px; font-size: 13px; cursor: pointer; color: #888; font-family: inherit;
      }
      .nav-arrow:hover { border-color: #bbb; color: #444; }
      .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); padding: 0 16px 8px; flex-shrink: 0; }
      .cal-day-label { font-size: 11px; color: #bbb; text-align: center; padding: 4px 0; }
      .cal-cell { min-height: 52px; border: 0.5px solid #f0efe8; padding: 4px; font-size: 11px; color: #888; background: #fff; cursor: pointer; }
      .cal-cell:hover { background: #faf9f7; }
      .cal-cell.today { background: #EEEDFE; }
      .day-num { font-size: 11px; margin-bottom: 2px; color: #888; }
      .muted-day { color: #ddd; }
      .cal-cell.today .day-num { color: #534AB7; font-weight: 600; }
      .cal-event {
        background: #CECBF6; color: #3C3489; border-radius: 3px; padding: 1px 4px; font-size: 10px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cal-event.teal { background: #9FE1CB; color: #085041; }
      .cal-event.coral { background: #F5C4B3; color: #712B13; }
      .sched-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
      .sched-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .sched-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .sched-dot.purple { background: #534AB7; }
      .sched-dot.coral { background: #D85A30; }
      .sched-dot.teal { background: #1D9E75; }
      .sched-info { flex: 1; }
      .sched-title { font-size: 13px; color: #1a1a1a; font-weight: 500; }
      .sched-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
      .docs-toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .search-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 6px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-upload {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer; color: #888; font-family: inherit; font-weight: 500; white-space: nowrap;
      }
      .btn-upload:hover { border-color: #bbb; color: #444; }
      .docs-grid {
        display: grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap: 10px; padding: 14px 16px; overflow-y: auto; flex: 1; align-content: start;
      }
      .doc-card { background: #fff; border: 1px solid #e0ddd5; border-radius: 12px; padding: 14px; cursor: pointer; }
      .doc-card:hover { border-color: #bbb; }
      .doc-icon {
        width: 36px; height: 44px; border-radius: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
      }
      .di-doc { background: #EEEDFE; color: #534AB7; }
      .di-pdf { background: #FCEBEB; color: #A32D2D; }
      .di-img { background: #FAEEDA; color: #854F0B; }
      .di-xls { background: #EAF3DE; color: #3B6D11; }
      .doc-name { font-size: 13px; color: #1a1a1a; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .doc-meta { font-size: 11px; color: #aaa; }
      .notif-section-label, .todo-section-label {
        padding: 8px 16px 4px; font-size: 11px; font-weight: 600; color: #bbb; letter-spacing: 0.04em; flex-shrink: 0;
      }
      .notif-section-label.nested, .todo-section-label.nested-todo { padding-top: 10px; padding-left: 16px; }
      .notif-list { flex: 1; overflow-y: auto; }
      .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f0efe8; cursor: pointer; }
      .notif-item:hover { background: #faf9f7; }
      .notif-icon { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; }
      .ni-p { background: #EEEDFE; }
      .ni-t { background: #E1F5EE; }
      .ni-a { background: #FAEEDA; }
      .ni-r { background: #FCEBEB; }
      .notif-body { flex: 1; }
      .notif-title { font-size: 13px; color: #1a1a1a; line-height: 1.5; }
      .notif-title b { font-weight: 600; }
      .notif-time { font-size: 11px; color: #bbb; margin-top: 2px; }
      .unread-dot { width: 6px; height: 6px; background: #534AB7; border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
      .todo-list { flex: 1; overflow-y: auto; padding: 0 16px; min-height: 0; }
      .todo-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .todo-check {
        width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #ddd; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff;
      }
      .todo-check:hover { border-color: #7F77DD; }
      .todo-check.done { background: #534AB7; border-color: #534AB7; position: relative; }
      .todo-check.done::after {
        content: ''; display: block; width: 9px; height: 5px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translateY(-1px);
      }
      .todo-text { flex: 1; font-size: 13px; color: #1a1a1a; }
      .todo-text.done { color: #bbb; text-decoration: line-through; }
      .todo-due { font-size: 11px; color: #aaa; white-space: nowrap; }
      .todo-due.urgent { color: #A32D2D; font-weight: 600; }
      .todo-add-row {
        display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .todo-add-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 7px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-add {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .btn-add:hover { background: #7F77DD; }
      @media (max-width: 820px) {
        .page-shell, .join-shell { padding: 0; }
        .wrap { height: 100vh; max-width: none; border-radius: 0; border-left: 0; border-right: 0; }
        .url-pill { display: none; }
      }
    `}</style>
  )
}
