import type { NotificationItem } from '../../room/types'

type NotificationsViewProps = {
  notifications: NotificationItem[]
}

export function NotificationsView({ notifications }: NotificationsViewProps) {
  return (
    <div className="page active">
      <div className="notif-section-label">오늘</div>
      <div className="notif-list">
        {notifications.map((item, index) => (
          <div key={`${item.time}-${index}`}>
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
  )
}
