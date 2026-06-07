import type { CSSProperties, ReactNode } from 'react'
import type { PageKey, ShellBackgroundKey } from '../types'
import { BackgroundToggle } from './BackgroundToggle'
import { RoomSidebar } from './RoomSidebar'
import { RoomTopbar } from './RoomTopbar'
import { SharePanel } from './SharePanel'

type RoomShellProps = {
  activePage: PageKey
  copied: boolean
  roomId: string
  roomTitle: string
  shellBackgroundStyle: CSSProperties
  showSharePanel: boolean
  shellBackground: ShellBackgroundKey
  url: string
  children: ReactNode
  onCopyLink: () => void
  onPageChange: (page: PageKey) => void
  onToggleBackground: () => void
  onToggleShare: () => void
}

export function RoomShell({
  activePage,
  copied,
  roomId,
  roomTitle,
  shellBackgroundStyle,
  showSharePanel,
  shellBackground,
  url,
  children,
  onCopyLink,
  onPageChange,
  onToggleBackground,
  onToggleShare,
}: RoomShellProps) {
  return (
    <div className="page-shell" style={shellBackgroundStyle}>
      <BackgroundToggle shellBackground={shellBackground} onToggle={onToggleBackground} />
      <div className="wrap">
        <RoomSidebar activePage={activePage} onPageChange={onPageChange} />

        <main className="main">
          <RoomTopbar activePage={activePage} roomId={roomId} roomTitle={roomTitle} onToggleShare={onToggleShare} />
          {showSharePanel && <SharePanel url={url} copied={copied} onCopy={onCopyLink} />}
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  )
}
