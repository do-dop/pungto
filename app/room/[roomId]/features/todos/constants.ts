import type { TodoItem } from './types'

export const initialTodos: TodoItem[] = [
  { id: 1, text: '랜딩 페이지 카피 초안 완성', due: '오늘 마감', urgent: true },
  { id: 2, text: '팀 위클리 준비 — 주간 요약 작성', due: '오늘 오후 2시', urgent: true },
  { id: 3, text: '기획서 v2 공유', due: '완료', done: true },
  { id: 4, text: '경쟁사 UI 벤치마킹 리포트', due: '4/18' },
  { id: 5, text: '사용자 인터뷰 설계서 작성', due: '4/20' },
  { id: 6, text: '디자인 시스템 검토 참석', due: '4/16' },
]
