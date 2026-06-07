# Pungto

Pungto는 팀 프로젝트를 위한 실시간 협업 웹앱입니다. 사용자는 협업방을 만들고, 링크나 QR 코드를 통해 팀원을 초대해 같은 공간에서 채팅, 일정, 칸반 태스크, 대시보드 등을 함께 관리할 수 있습니다.

## 주요 기능

- 협업방 생성 및 입장
- 방 비밀번호 기반 입장 흐름
- 링크 및 QR 코드 초대
- 실시간 채팅
- 칸반 태스크 관리
- 프로젝트 대시보드
- 일정 생성, 수정, 삭제 및 실시간 반영
- 자료, 알림, 개인 할 일 화면

## 기술 스택

- Next.js App Router
- React
- TypeScript
- Supabase
- Tailwind CSS

## 프로젝트 구조

방 내부 기능은 `app/room/[roomId]/features` 아래에서 기능별로 분리되어 있습니다.

```text
app/room/[roomId]/features/
├── chat/
├── dashboard/
├── kanban/
├── schedule/
├── documents/
├── notifications/
├── todos/
└── room/
```

각 기능은 화면 컴포넌트, 상태 관리 hook, Supabase 접근 service, 타입 정의를 중심으로 구성되어 있습니다.

## 문서

- 바이브코딩 프로세스 프롬프트 결과물: `docs/process/vibecoding-process-prompt.md`
