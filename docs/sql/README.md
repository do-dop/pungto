# Pungto Supabase SQL 실행 순서

## 실행 순서

1. `create-room-access.sql`
   - rooms, room_members, 방 비밀번호, 방 입장 RPC, 기본 RLS 정책 생성
   - 다른 기능의 RLS 정책이 room_members를 참조하므로 가장 먼저 실행한다.

2. `create-messages-table.sql`
   - members, messages 테이블 생성
   - 채팅 메시지 저장 및 Realtime 동기화에 사용한다.

3. `create-dashboard-tables.sql`
   - room_dashboard, dashboard_links, team_roles 테이블 생성
   - 프로젝트 대시보드, 참고 링크, 팀원 역할 관리에 사용한다.

4. `create-tasks-table.sql`
   - tasks 테이블 생성
   - 칸반 태스크 저장 및 상태 변경에 사용한다.

5. `create-schedules-table.sql`
   - schedules 테이블 생성
   - 일정 생성, 수정, 삭제, Realtime 동기화에 사용한다.

## 주의사항

- `create-room-access.sql`을 가장 먼저 실행해야 한다.
- RLS 정책은 room_members를 기준으로 방 멤버만 데이터에 접근하도록 제한한다.
- 실제 운영 환경에서는 방 관리자 권한, 초대 권한, 사용자 역할 정책을 추가로 강화해야 한다.