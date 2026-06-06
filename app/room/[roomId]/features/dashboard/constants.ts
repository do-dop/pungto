import type { DashboardLink, TeamRole } from './types'

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
