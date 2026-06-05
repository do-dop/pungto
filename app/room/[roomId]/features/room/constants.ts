import type {
  DashboardLink,
  DocumentItem,
  KanbanColumnKey,
  KanbanTask,
  NotificationItem,
  PageKey,
  ShellBackgroundKey,
  TeamRole,
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

export const kanbanColumns: Array<{ key: KanbanColumnKey; label: string }> = [
  { key: 'todo', label: '할 일' },
  { key: 'doing', label: '진행 중' },
  { key: 'review', label: '검토 중' },
  { key: 'done', label: '완료' },
]

export const initialKanbanTasks: KanbanTask[] = [
  {
    id: 1,
    title: '경쟁사 UI 벤치마킹',
    category: '기획',
    categoryClass: 'tag-p',
    due: '~ 4/18',
    owner: '이수연',
    status: 'todo',
    description: '주요 경쟁 서비스 5개를 비교해서 IA, 온보딩, 협업 경험 차이를 정리합니다.',
  },
  {
    id: 2,
    title: '사용자 인터뷰 설계',
    category: '리서치',
    categoryClass: 'tag-t',
    due: '~ 4/20',
    owner: '김정현',
    status: 'todo',
    description: '인터뷰 대상자 기준과 핵심 질문 리스트를 정리하고 사전 스크립트를 작성합니다.',
  },
  {
    id: 3,
    title: '랜딩 페이지 카피 작성',
    category: '마케팅',
    categoryClass: 'tag-a',
    due: '~ 4/12 마감 초과',
    owner: '나',
    status: 'todo',
    overdue: true,
    description: '첫 방문 사용자가 5초 안에 제품 가치를 이해할 수 있도록 헤드라인과 서브카피를 다듬습니다.',
  },
  {
    id: 4,
    title: '프로토타입 1차 개발',
    category: '개발',
    categoryClass: 'tag-p',
    due: '~ 4/22',
    owner: '박준호',
    status: 'doing',
    description: '핵심 협업 흐름과 방 입장 경험을 우선 구현하고, 모바일 레이아웃도 함께 점검합니다.',
  },
  {
    id: 5,
    title: '기획서 v2 작성',
    category: '기획',
    categoryClass: 'tag-t',
    due: '~ 4/19',
    owner: '이수연',
    status: 'doing',
    description: '화면 흐름 업데이트와 함께 우선순위, 실험 범위, 검증 지표를 다시 정리합니다.',
  },
  {
    id: 6,
    title: '디자인 시스템 정의',
    category: '디자인',
    categoryClass: 'tag-a',
    due: '~ 4/16',
    owner: '김정현',
    status: 'review',
    description: '컬러, 타이포, 버튼, 입력창 규칙을 정리해서 이후 화면 작업에 재사용할 수 있게 합니다.',
  },
  {
    id: 7,
    title: '프로젝트 킥오프 미팅',
    category: '기획',
    categoryClass: 'tag-t',
    due: '완료',
    owner: '팀 전체',
    status: 'done',
    description: '프로젝트 목표와 역할 분담을 확정했습니다.',
  },
  {
    id: 8,
    title: '팀 온보딩 문서 공유',
    category: '기획',
    categoryClass: 'tag-p',
    due: '완료',
    owner: '나',
    status: 'done',
    description: '필수 문서와 작업 규칙을 팀에 공유했습니다.',
  },
]

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

export const initialDashboardLinks: DashboardLink[] = [
  { id: 1, label: '프로덕트 리포지토리', url: 'https://github.com/team/pungto', kind: 'github' },
  { id: 2, label: '메인 피그마 파일', url: 'https://www.figma.com/file/example', kind: 'figma' },
  { id: 3, label: '기획 노션 문서', url: 'https://www.notion.so/example', kind: 'notion' },
]

export const initialTeamRoles: TeamRole[] = [
  { id: 1, name: '이수연', role: 'PM' },
  { id: 2, name: '김정현', role: 'Product Designer' },
  { id: 3, name: '박준호', role: 'Frontend Developer' },
]

export const initialProjectSummary = '가입 없이 빠르게 협업방을 만들고, 실시간 채팅과 태스크 관리까지 한 번에 해결하는 팀 협업 도구를 만들고 있습니다.'
export const initialProjectGoal = '첫 사용자가 3분 안에 방 생성, 팀 초대, 첫 태스크 등록까지 완료할 수 있게 만드는 것이 현재 목표입니다.'
export const initialProjectName = 'Pungto 프로젝트'

export const SHELL_BACKGROUND_STORAGE_KEY = 'pungto-room-shell-background'
export const shellBackgroundLabels: Record<ShellBackgroundKey, string> = {
  default: '기본',
  rolophus: '롤로퍼스',
}
export const shellBackgroundOrder: ShellBackgroundKey[] = ['default', 'rolophus']
