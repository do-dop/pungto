type RoomJoinGateProps = {
  roomTitle: string
  name: string
  roomPassword: string
  joinNotice: string
  onNameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onClearNotice: () => void
  onStartComposition: () => void
  onEndComposition: () => void
  isComposing: () => boolean
  onJoin: () => void
}

export function RoomJoinGate({
  roomTitle,
  name,
  roomPassword,
  joinNotice,
  onNameChange,
  onPasswordChange,
  onClearNotice,
  onStartComposition,
  onEndComposition,
  isComposing,
  onJoin,
}: RoomJoinGateProps) {
  return (
    <div className="join-card">
      <div className="join-badge">참여하기</div>
      <div className="logo join-logo">⬡</div>
      <h2 className="join-title">Pungto</h2>
      <div className="join-room-title">{roomTitle}</div>
      <p className="join-desc">이름과 방 비밀번호를 입력하면 시작해요</p>
      <input
        className="join-input"
        placeholder="이름 또는 닉네임"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onCompositionStart={onStartComposition}
        onCompositionEnd={onEndComposition}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !isComposing()) onJoin()
        }}
        autoFocus
      />
      <input
        className="join-input"
        type="password"
        placeholder="방 비밀번호"
        value={roomPassword}
        onChange={(event) => {
          onPasswordChange(event.target.value)
          onClearNotice()
        }}
        onCompositionStart={onStartComposition}
        onCompositionEnd={onEndComposition}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !isComposing()) onJoin()
        }}
        autoComplete="current-password"
      />
      {joinNotice && <p className="join-error">{joinNotice}</p>}
      <button className="join-btn" onClick={onJoin}>입장</button>
      <p className="join-hint">이전 이름은 이 기기에서 자동으로 기억돼요</p>
    </div>
  )
}
