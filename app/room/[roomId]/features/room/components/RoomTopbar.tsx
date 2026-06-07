import { pageTitles } from '../constants'
import type { PageKey } from '../types'

type RoomTopbarProps = {
  activePage: PageKey
  roomId: string
  roomTitle: string
  onToggleShare: () => void
}

export function RoomTopbar({ activePage, roomId, roomTitle, onToggleShare }: RoomTopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-title">
        <span className="room-title">{roomTitle}</span>
        <span className="page-title">{pageTitles[activePage]}</span>
      </div>
      <div className="url-pill" onClick={onToggleShare}>
        <div className="green-dot" />
        <span>{`pungto.app/r/${roomId}`}</span>
      </div>
      <button className="btn-share" onClick={onToggleShare}>링크 공유</button>
    </div>
  )
}
