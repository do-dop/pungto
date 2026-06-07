# Pungto 일정 관리 기능 품질관리 결과

## 1. 품질관리 목적

본 문서는 Pungto 일정 관리 기능 개선 과정에서 수행한 품질관리 활동과 그 결과를 정리한다.

초기 Pungto는 생성형 AI를 활용하여 빠르게 구현되었지만, 요구사항 분석, 설계, 테스트 계획, 품질 기준 없이 기능이 누적되었다. 그 결과 실제 동작 기능과 목업 기능이 혼재하고, 주요 기능이 하나의 큰 파일에 집중되는 문제가 있었다.

이번 일정 기능 개선에서는 요구사항 명세, 유스케이스, 설계, 테스트 계획을 먼저 작성하고, 이를 기준으로 구현과 검증을 수행하였다.

---

## 2. 품질 목표와 적용 결과

| 품질 속성   | 품질 목표                                   | 적용 결과                                                               |
| ------- | --------------------------------------- | ------------------------------------------------------------------- |
| 기능 적합성  | 일정 생성, 조회, 수정, 삭제가 요구사항대로 동작해야 한다.      | Supabase 기반 CRUD 구현 및 테스트 통과                                        |
| 신뢰성     | 같은 방의 일정만 표시되고 다른 방의 일정과 섞이지 않아야 한다.    | roomId 기준 조회/저장 및 room_members 기반 RLS 적용                             |
| 강인성     | 제목 또는 날짜가 없는 잘못된 입력을 처리해야 한다.           | 필수 입력 검증 및 안내 메시지 추가                                                |
| 실시간성    | 같은 방의 다른 접속자에게 일정 변경이 새로고침 없이 반영되어야 한다. | Supabase Realtime 적용 및 생성/수정/삭제 동기화 확인                              |
| 유지보수성   | 일정 기능이 기존 대형 page.tsx에 계속 누적되지 않아야 한다.  | `features/schedule` 디렉토리로 기능 분리                                     |
| 모듈성     | UI, 데이터 로직, 타입 정의가 역할별로 분리되어야 한다.       | `ScheduleView`, `ScheduleFormModal`, `useSchedules`, `types.ts`로 분리 |
| 테스트 가능성 | 요구사항이 테스트 케이스와 연결되어야 한다.                | 테스트 계획 및 테스트 결과 문서 작성                                               |
| 회귀 안정성  | 일정 기능 추가 후 기존 채팅과 칸반이 정상 동작해야 한다.       | 채팅 및 칸반 회귀 테스트 통과                                                   |

### 2.1 추가 품질관리 항목

| 구분 | 품질 속성 | 개선 내용 |
| --- | --- | --- |
| 방 접근/보안 | 보안성 | 방 비밀번호, Supabase 익명 인증, `room_members` 기반 RLS 적용 |
| 방 접근/보안 | 데이터 정합성 | `roomId` 기준 일정, 채팅, 태스크, 대시보드 데이터 분리 |
| 일정 기능 | 접근성 | 일정 모달 `role`, `aria-modal`, ESC 닫기, backdrop 닫기 추가 |
| 일정 기능 | 빌드 안정성 | Google Font 의존 제거 |
| 데이터베이스 | 재현 가능성 | SQL 파일 기능별 분리 및 실행 순서 문서화 |
| 코드 구조 | 유지보수성 | feature-based modular structure와 hook/service 계층 분리 적용 |
| 테스트 | 테스트 가능성 | 요구사항 기반 테스트 결과 문서화 |

---

## 3. 코드 구조 품질관리

이번 개선에서는 일정 기능을 포함한 방 내부 기능을 기능 단위로 분리하였다.

```text
app/
└── room/
    └── [roomId]/
        └── features/
            ├── chat/
            │   ├── components/
            │   ├── hooks/
            │   ├── services/
            │   ├── types.ts
            │   └── utils.ts
            ├── dashboard/
            │   ├── components/
            │   ├── hooks/
            │   ├── services/
            │   ├── constants.ts
            │   ├── types.ts
            │   └── utils.ts
            ├── kanban/
            │   ├── components/
            │   ├── hooks/
            │   ├── services/
            │   ├── constants.ts
            │   ├── types.ts
            │   └── utils.ts
            ├── room/
            │   ├── components/
            │   ├── hooks/
            │   ├── services/
            │   ├── constants.ts
            │   ├── types.ts
            │   └── utils.ts
            └── schedule/
                ├── components/
                │   ├── ScheduleView.tsx
                │   ├── ScheduleFormModal.tsx
                │   └── ScheduleItem.tsx
                ├── hooks/
                │   └── useSchedules.ts
                ├── services/
                │   └── scheduleService.ts
                └── types.ts
```

기존에는 방 화면의 여러 기능이 `page.tsx`에 집중되어 있었다. 개선 후에는 채팅, 대시보드, 칸반, 일정, 방 입장 기능을 각각 feature 디렉토리로 분리하고, 각 기능 내부에서 표현 계층, 상태/흐름 계층, 데이터 접근 계층을 나누었다.

* `components`: 화면 표시와 사용자 입력 UI 담당
* `hooks`: 상태 관리, 사용자 이벤트 흐름, Realtime 구독 제어 담당
* `services`: Supabase CRUD, RPC, Realtime channel 접근 담당
* `types`: 기능별 데이터 타입 담당
* `constants`: 초기값과 고정 옵션 담당
* `utils`: row 변환, 날짜/시간 포맷 등 순수 유틸 담당

이에 따라 `app/room/[roomId]/page.tsx`는 채팅, 대시보드, 칸반, 일정 데이터에 직접 접근하지 않고 각 feature hook을 호출하여 화면을 조립하는 컨테이너 역할에 가까워졌다. 일정 기능도 `useSchedules`가 상태와 사용자 흐름을 담당하고, `scheduleService.ts`가 Supabase 접근을 담당하도록 분리하였다.

### 3.1 아키텍처 및 유지보수성 품질 개선

초기 Pungto는 여러 기능의 UI, 상태, 유틸, 스타일이 `page.tsx`에 집중되어 있었다. 개선 후에는 `features/chat`, `features/dashboard`, `features/kanban`, `features/schedule`, `features/room`, `features/todos` 등 기능 단위 디렉토리로 분리하였다.

현재 구조는 완전한 Clean Architecture나 MVC, MVVM은 아니지만, Next.js App Router 기반의 feature-based modular structure에 hook/service 계층 분리를 적용한 구조이다. UI 컴포넌트는 화면 표현만 담당하고, hook은 상태와 사용자 이벤트 흐름을 관리하며, service는 Supabase 데이터 접근을 담당하도록 책임을 나누었다.

이 구조는 특정 기능을 수정할 때 영향 범위를 줄이고, Supabase 접근 코드가 여러 화면 컴포넌트에 흩어지는 문제를 줄인다. 따라서 초기 구조보다 유지보수성, 테스트 가능성, 변경 용이성이 개선되었다.

이 구조는 향후 자료, 알림, 할 일 기능을 개선할 때도 `features/documents`, `features/notifications`, `features/todos`와 같은 방식으로 확장할 수 있다.

---

## 4. 데이터 및 Supabase 품질관리

일정 기능을 실제 데이터 기반으로 구현하기 위해 방 접근 제어 SQL과 일정 SQL을 분리하여 기록하였다. `docs/sql/create-room-access.sql`은 방 비밀번호, 익명 사용자 멤버십, 접근 제어 RPC를 담당하고, `docs/sql/create-schedules-table.sql`은 일정 테이블과 일정 CRUD 정책을 담당한다.

주요 품질관리 항목은 다음과 같다.

* `room_id` 기준 일정 분리
* `title`, `scheduled_date` 필수값 지정
* `color` 컬럼과 check constraint 추가
* `room_id` 인덱스 생성
* Supabase 익명 Auth 기반 사용자 식별
* 방 비밀번호 해시 저장 및 RPC 기반 입장 검증
* `room_members` 기반 방 참여자 기록
* RLS 활성화 및 방 참여자 기준 일정 CRUD policy 설정
* Supabase Realtime publication 등록
* DELETE 이벤트 처리를 위한 `replica identity full` 설정

현재 RLS 정책은 초대 링크로 방에 입장한 사용자를 Supabase 익명 Auth 사용자로 식별하고, 방 비밀번호 검증 RPC를 통과해 `room_members`에 등록된 사용자만 해당 방의 일정을 조회, 생성, 수정, 삭제할 수 있도록 설정하였다. 따라서 프론트엔드의 `roomId` 필터링뿐 아니라 데이터베이스 정책 차원에서도 방별 일정 분리를 검증한다.

---

## 5. 정적 검사 및 빌드 결과

| 항목              | 결과 | 비고                                            |
| --------------- | -- | --------------------------------------------- |
| `npm run lint`  | 통과 | ESLint 기준 통과                                  |
| `npm run build` | 통과 | Next.js workspace root 경고 발생, 일정 기능과 직접 관련 없음 |

빌드 과정에서 상위 디렉토리와 현재 프로젝트 디렉토리에 각각 `package-lock.json`이 존재한다는 workspace root 경고가 발생하였다. 이는 일정 기능 구현 자체의 오류는 아니며, 향후 `next.config.ts`의 `turbopack.root` 설정 또는 중복 lockfile 정리로 개선할 수 있다.

---

## 6. 품질관리 중 발견한 개선점

### 6.1 기존 디자인과 기능 개선의 일관성

이번 개선에서는 기존 일정 탭의 달력 기반 디자인을 유지하고, 내부의 고정 목업 데이터를 Supabase 기반 실제 데이터로 교체하였다.

이를 통해 사용자는 기존에 익숙한 화면 흐름을 유지하면서도 일정 생성, 수정, 삭제, 색상 선택, 실시간 동기화 기능을 사용할 수 있게 되었다. 기능 개선 과정에서 기존 사용자 경험과 시각적 일관성을 함께 유지하는 것이 중요함을 확인하였다.

### 6.2 실시간 기능은 이벤트별 검증이 필요함

생성과 수정은 다른 브라우저에 반영되었지만, 삭제는 초기에 반영되지 않았다. DELETE 이벤트는 INSERT, UPDATE와 payload 구조가 다를 수 있기 때문에 별도 검증이 필요했다.

이를 통해 실시간 기능은 단순히 Realtime 구독을 추가하는 것만으로 충분하지 않고, 이벤트 타입별 상태 갱신 방식을 테스트해야 함을 확인하였다.

### 6.3 현재 사용자 상태와 다른 사용자 상태를 모두 고려해야 함

처음에는 생성, 수정, 삭제 후 현재 사용자 화면 갱신을 Realtime 이벤트에만 의존하였다. 그러나 현재 사용자는 DB 요청 성공 직후 바로 화면이 갱신되는 것이 자연스럽다.

따라서 현재 사용자 화면은 CRUD 성공 결과로 즉시 갱신하고, 다른 접속자는 Realtime 이벤트로 동기화하는 방식으로 수정하였다.

---

## 7. 품질관리 결과 요약

이번 개선을 통해 Pungto의 일정 기능은 목업 상태에서 실제 Supabase 기반 협업 기능으로 전환되었다. 또한 기존 달력 디자인을 유지하면서 일정 생성, 수정, 삭제, 색상 선택, roomId 기반 데이터 분리, Realtime 동기화를 구현하였다.

품질관리 측면에서는 요구사항 기반 테스트, 회귀 테스트, lint/build 검사, Supabase SQL 문서화, 방 멤버 기반 RLS 접근 제어 검증을 수행하였다. 또한 feature-based modular structure와 hook/service 계층 분리를 적용하여 유지보수성과 변경 용이성을 개선하였다. 이를 통해 생성형 AI를 활용한 개발에서도 명확한 요구사항과 설계, 테스트 기준이 있어야 품질을 통제할 수 있음을 확인하였다.

---

## 8. 프로세스 적용의 교훈

프로세스 없이 바이브코딩을 수행했을 때는 화면과 기능이 빠르게 생성되지만, 실제 동작 여부, 데이터 구조, 예외 처리, 실시간 동기화, 유지보수성까지 보장되지는 않았다.

이번 개선에서는 요구사항 분석, 유스케이스 명세, 설계 문서, 테스트 계획을 먼저 작성하고 이를 기준으로 구현하였다. 그 결과 AI가 생성하거나 수정한 코드를 그대로 받아들이는 것이 아니라, 기존 디자인 유지, 기능 단위 모듈화, 계층 분리, `roomId` 기반 데이터 분리, Realtime 동기화, RLS 접근 제어와 같은 품질 기준을 바탕으로 검토하고 수정할 수 있었다.

따라서 바이브코딩은 프로세스를 생략하는 방식이 아니라, 명확한 프로세스 안에서 구현 속도를 높이는 도구로 활용될 때 가장 효과적이라는 교훈을 얻었다.
