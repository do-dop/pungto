'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSessionId } from '@/lib/session'
import { ChatView } from './features/chat/components/ChatView'
import { useMessages } from './features/chat/hooks/useMessages'
import { DashboardView } from './features/dashboard/components/DashboardView'
import { useDashboard } from './features/dashboard/hooks/useDashboard'
import { DocumentsView } from './features/documents/components/DocumentsView'
import { KanbanView } from './features/kanban/components/KanbanView'
import { kanbanColumns } from './features/kanban/constants'
import { useKanbanTasks } from './features/kanban/hooks/useKanbanTasks'
import { NotificationsView } from './features/notifications/components/NotificationsView'
import { BackgroundToggle } from './features/room/components/BackgroundToggle'
import { GlobalStyles } from './features/room/components/GlobalStyles'
import { RoomJoinGate } from './features/room/components/RoomJoinGate'
import { RoomShell } from './features/room/components/RoomShell'
import {
  docsData,
  notifications,
  SHELL_BACKGROUND_STORAGE_KEY,
} from './features/room/constants'
import { useRoomAccess } from './features/room/hooks/useRoomAccess'
import type { PageKey, ShellBackgroundKey } from './features/room/types'
import { getNextShellBackground, getShellBackgroundStyle } from './features/room/utils'
import { ScheduleView } from './features/schedule/components/ScheduleView'
import { TodoView } from './features/todos/components/TodoView'
import { useTodos } from './features/todos/hooks/useTodos'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [shellBackground, setShellBackground] = useState<ShellBackgroundKey>(() => {
    if (typeof window === 'undefined') return 'default'
    const saved = window.localStorage.getItem(SHELL_BACKGROUND_STORAGE_KEY)
    return saved === 'rolophus' ? 'rolophus' : 'default'
  })
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const sessionId = getSessionId()
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const roomAccess = useRoomAccess(roomId, sessionId)
  const messages = useMessages({
    roomId,
    joined: roomAccess.joined,
    sessionId,
    displayName: roomAccess.name,
  })
  const dashboard = useDashboard(roomId, roomAccess.joined)
  const kanban = useKanbanTasks({
    roomId,
    joined: roomAccess.joined,
    sessionId,
    ownerName: roomAccess.name,
  })
  const todos = useTodos()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SHELL_BACKGROUND_STORAGE_KEY, shellBackground)
  }, [shellBackground])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (!roomAccess.joined) {
    return (
      <>
        <div className="join-shell" style={getShellBackgroundStyle(shellBackground)}>
          <BackgroundToggle shellBackground={shellBackground} onToggle={() => setShellBackground(getNextShellBackground(shellBackground))} />
          <RoomJoinGate
            roomTitle={roomAccess.roomTitle}
            name={roomAccess.name}
            roomPassword={roomAccess.roomPassword}
            joinNotice={roomAccess.joinNotice}
            onNameChange={roomAccess.setName}
            onPasswordChange={roomAccess.setRoomPassword}
            onClearNotice={() => roomAccess.setJoinNotice('')}
            onStartComposition={roomAccess.startComposition}
            onEndComposition={roomAccess.endComposition}
            isComposing={roomAccess.isComposing}
            onJoin={() => void roomAccess.join()}
          />
        </div>
        <GlobalStyles />
      </>
    )
  }

  return (
    <>
      <RoomShell
        activePage={activePage}
        copied={copied}
        roomId={roomId}
        roomTitle={roomAccess.roomTitle}
        shellBackground={shellBackground}
        shellBackgroundStyle={getShellBackgroundStyle(shellBackground)}
        showSharePanel={showQR}
        url={url}
        onCopyLink={copyLink}
        onPageChange={setActivePage}
        onToggleBackground={() => setShellBackground(getNextShellBackground(shellBackground))}
        onToggleShare={() => setShowQR((prev) => !prev)}
      >
              {activePage === 'dashboard' && (
                <DashboardView
                  roomId={roomId}
                  dashboardNotice={dashboard.dashboardNotice}
                  projectName={dashboard.projectName}
                  projectSummary={dashboard.projectSummary}
                  projectGoal={dashboard.projectGoal}
                  dashboardLinks={dashboard.dashboardLinks}
                  linkKindInput={dashboard.linkKindInput}
                  linkLabelInput={dashboard.linkLabelInput}
                  linkUrlInput={dashboard.linkUrlInput}
                  teamRoles={dashboard.teamRoles}
                  onProjectNameChange={dashboard.updateProjectName}
                  onProjectSummaryChange={dashboard.updateProjectSummary}
                  onProjectGoalChange={dashboard.updateProjectGoal}
                  onLinkKindChange={dashboard.setLinkKindInput}
                  onLinkLabelChange={dashboard.setLinkLabelInput}
                  onLinkUrlChange={dashboard.setLinkUrlInput}
                  onAddDashboardLink={dashboard.addDashboardLink}
                  onRemoveDashboardLink={dashboard.removeDashboardLink}
                  onAddTeamRole={dashboard.addTeamRole}
                  onUpdateTeamRole={dashboard.updateTeamRole}
                  onRemoveTeamRole={dashboard.removeTeamRole}
                />
              )}

              {activePage === 'chat' && (
                <ChatView
                  messages={messages.messages}
                  sessionId={sessionId}
                  input={messages.input}
                  chatScrollRef={messages.chatScrollRef}
                  bottomRef={messages.bottomRef}
                  composingRef={messages.composingRef}
                  onInputChange={messages.setInput}
                  onSendMessage={messages.sendMessage}
                />
              )}

              {activePage === 'kanban' && (
                <KanbanView
                  columns={kanbanColumns}
                  tasks={kanban.tasks}
                  selectedTask={kanban.selectedTask}
                  selectedTaskId={kanban.selectedTaskId}
                  draggingTaskId={kanban.draggingTaskId}
                  dragOverColumn={kanban.dragOverColumn}
                  taskNotice={kanban.taskNotice}
                  onDragOverColumn={kanban.setDragOverColumn}
                  onClearDragOverColumn={() => kanban.setDragOverColumn(null)}
                  onDraggingTaskChange={kanban.setDraggingTaskId}
                  onSelectTask={kanban.setSelectedTaskId}
                  onUpdateTask={kanban.updateTask}
                  onAddTask={kanban.addTask}
                  onDeleteTask={kanban.deleteTask}
                />
              )}

              {activePage === 'schedule' && (
                <div className="page active">
                  <ScheduleView roomId={roomId} sessionId={roomAccess.authUserId ?? sessionId} />
                </div>
              )}

              {activePage === 'docs' && (
                <DocumentsView documents={docsData} />
              )}

              {activePage === 'notif' && (
                <NotificationsView notifications={notifications} />
              )}

              {activePage === 'todo' && (
                <TodoView
                  todos={todos.todos}
                  todoInput={todos.todoInput}
                  composingRef={todos.composingRef}
                  onInputChange={todos.setTodoInput}
                  onAddTodo={todos.addTodo}
                  onToggleTodo={todos.toggleTodo}
                />
              )}
      </RoomShell>
      <GlobalStyles />
    </>
  )
}
