import type {
  DocumentItem,
  NotificationItem,
  PageKey,
  ShellBackgroundKey,
  TodoItem,
} from './types'

export const pageTitles: Record<PageKey, string> = {
  dashboard: '프로젝트 — 대시보드',
  chat: '채팅',
  kanban: '프로젝트 — 칸반 보드',
  schedule: '프로젝트 — 일정',
  docs: '자료',
  notif: '알림',
  todo: '할 일',
}

export const docsData: DocumentItem[] = [
  { ext: 'DOC', className: 'di-doc', name: 'Q2 기획서 v2', meta: '방금 수정됨' },
  { ext: 'DOC', className: 'di-doc', name: '온보딩 가이드', meta: '3일 전 수정됨' },
  { ext: 'PDF', className: 'di-pdf', name: '경쟁사 분석 보고서', meta: '이수연 · 1주 전' },
  { ext: 'IMG', className: 'di-img', name: '디자인 시스템 v1', meta: '김정현 · 2일 전' },
  { ext: 'XLS', className: 'di-xls', name: '예산 계획서', meta: '나 · 4일 전' },
  { ext: 'DOC', className: 'di-doc', name: '회의록 4/7', meta: '김정현 · 7일 전' },
]

export const notifications: NotificationItem[] = [
  { tone: 'ni-r', title: '<b>랜딩 페이지 카피</b> 마감이 지났어요', time: '30분 전', unread: true },
  { tone: 'ni-p', title: '<b>이수연</b>이 채팅에 메시지를 남겼어요', time: '1시간 전', unread: true },
  { tone: 'ni-a', title: '오늘 오후 3시 <b>팀 위클리</b> 일정이 있어요', time: '2시간 전', unread: true },
  { tone: 'ni-t', title: '<b>김정현</b>이 디자인 시스템 v1 파일을 업로드했어요', time: '어제 오후 4:12' },
  { tone: 'ni-p', title: '<b>프로토타입 1차 개발</b> 카드가 진행 중으로 이동됐어요', time: '어제 오전 11:30' },
]

export const initialTodos: TodoItem[] = [
  { id: 1, text: '랜딩 페이지 카피 초안 완성', due: '오늘 마감', urgent: true },
  { id: 2, text: '팀 위클리 준비 — 주간 요약 작성', due: '오늘 오후 2시', urgent: true },
  { id: 3, text: '기획서 v2 공유', due: '완료', done: true },
  { id: 4, text: '경쟁사 UI 벤치마킹 리포트', due: '4/18' },
  { id: 5, text: '사용자 인터뷰 설계서 작성', due: '4/20' },
  { id: 6, text: '디자인 시스템 검토 참석', due: '4/16' },
]

export const SHELL_BACKGROUND_STORAGE_KEY = 'pungto-room-shell-background'
export const shellBackgroundLabels: Record<ShellBackgroundKey, string> = {
  default: '기본',
  rolophus: '롤로퍼스',
}
export const shellBackgroundOrder: ShellBackgroundKey[] = ['default', 'rolophus']
