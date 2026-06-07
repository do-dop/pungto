import { pageTitles } from '../constants'
import type { PageKey } from '../types'
import { NavIcon } from './NavIcon'

type RoomSidebarProps = {
  activePage: PageKey
  onPageChange: (page: PageKey) => void
}

const primaryPages: PageKey[] = ['dashboard', 'chat', 'kanban', 'schedule', 'docs']
const secondaryPages: PageKey[] = ['notif', 'todo']

export function RoomSidebar({ activePage, onPageChange }: RoomSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">⬡</div>
      {primaryPages.map((key) => (
        <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => onPageChange(key)} title={pageTitles[key]}>
          <NavIcon type={key} />
        </button>
      ))}
      <div className="nav-sep" />
      {secondaryPages.map((key) => (
        <button key={key} className={`nav-btn ${activePage === key ? 'active' : ''}`} onClick={() => onPageChange(key)} title={pageTitles[key]}>
          {key === 'notif' ? <div className="badge" /> : null}
          <NavIcon type={key} />
        </button>
      ))}
    </aside>
  )
}
