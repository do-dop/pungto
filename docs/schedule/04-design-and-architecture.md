# Pungto 일정 관리 기능 설계 및 아키텍처 문서

## 1. 설계 목적

본 문서는 Pungto의 일정 기능을 목업 화면에서 실제 실시간 협업 기능으로 개선하기 위한 설계 내용을 정의한다.

기존 Pungto는 방 화면의 여러 기능이 하나의 큰 페이지 파일에 집중되어 있어, 새로운 기능을 추가할수록 유지보수성이 낮아질 수 있는 구조였다. 따라서 이번 일정 기능 개선에서는 단순히 기능을 추가하는 것뿐 아니라, UI와 데이터 처리 로직을 분리하여 모듈성과 유지보수성을 높이는 것을 설계 목표로 한다.

---

## 2. 설계 목표

| 설계 목표 | 적용 방향 |
|---|---|
| 모듈성 | 일정 UI와 일정 데이터 처리 로직을 별도 파일로 분리한다. |
| 높은 응집도 | 일정 관련 기능은 일정 컴포넌트와 hook 내부에 모은다. |
| 낮은 결합도 | 방 화면 `page.tsx`는 일정 세부 로직을 직접 알지 않도록 한다. |
| 단일 책임 | 각 컴포넌트는 하나의 역할만 담당하도록 분리한다. |
| 테스트 가능성 | 일정 CRUD, 입력 검증, 실시간 반영을 독립적으로 확인할 수 있게 한다. |
| 신뢰성 | room ID 기반으로 일정 데이터를 분리하고, 기존 채팅·칸반 기능 회귀를 확인한다. |

---

## 3. 목표 파일 구조

```text
doco/
└── app/
    └── room/
        └── [roomId]/
            ├── page.tsx
            ├── components/
            │   ├── ScheduleView.tsx
            │   ├── ScheduleFormModal.tsx
            │   └── ScheduleItem.tsx
            └── hooks/
                └── useSchedules.ts
```

---

## 4. 모듈 책임

| 모듈 | 책임 |
|---|---|
| `page.tsx` | 방 화면 전체 레이아웃, 탭 연결, room ID 전달 |
| `ScheduleView.tsx` | 일정 목록 표시, 추가·수정·삭제 UI 이벤트 연결 |
| `ScheduleFormModal.tsx` | 일정 생성 및 수정 입력 폼, 입력 검증 메시지 표시 |
| `ScheduleItem.tsx` | 개별 일정 정보 표시, 수정·삭제 버튼 제공 |
| `useSchedules.ts` | 일정 조회, 생성, 수정, 삭제, Supabase Realtime 구독 관리 |

---

## 5. 데이터 모델 설계

Supabase에 `schedules` 테이블을 추가한다고 가정한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | 일정 고유 ID |
| `room_id` | text | 일정이 속한 방 ID |
| `title` | text | 일정 제목 |
| `description` | text | 일정 설명 |
| `scheduled_date` | date | 일정 날짜 |
| `color` | text | 일정 표시 색상: `purple`, `teal`, `coral` |
| `created_by` | text | 생성자 session ID |
| `created_at` | timestamp | 생성 시각 |
| `updated_at` | timestamp | 수정 시각 |

---

## 6. Supabase 테이블 설계 SQL

SQL 산출물은 책임에 따라 두 파일로 분리하였다. 방 생성, 방 비밀번호, 참여자 등록, 접근 제어 함수는 `docs/sql/create-room-access.sql`에 두고, 일정 테이블과 일정 CRUD RLS, Realtime 설정은 `docs/sql/create-schedules-table.sql`에 둔다. 일정 RLS가 `room_members`를 참조하므로 실행 순서는 `create-room-access.sql` 이후 `create-schedules-table.sql`이다.

```sql
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  title text not null,
  description text,
  scheduled_date date not null,
  color text not null default 'purple',
  created_by text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint schedules_color_check
    check (color in ('purple', 'teal', 'coral'))
);

create table if not exists room_members (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at timestamp with time zone default now(),
  primary key (room_id, user_id)
);

create table if not exists room_secrets (
  room_id text primary key references rooms(id) on delete cascade,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_schedules_room_id
on schedules(room_id);

alter table schedules replica identity full;

alter table schedules enable row level security;
alter table room_members enable row level security;
alter table room_secrets enable row level security;

-- 방 비밀번호는 room_secrets에 crypt() 해시로 저장한다.
-- 클라이언트는 room_members에 직접 insert하지 않고,
-- join_room_with_password() RPC가 비밀번호 검증 후 멤버를 등록한다.

create policy "Allow room members to read schedules"
on schedules
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = schedules.room_id
      and room_members.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table schedules;
```

---

## 7. 주요 동작 흐름

### 7.1 일정 목록 조회

1. 사용자가 방에 입장한다.
2. `page.tsx`는 현재 `roomId`를 `ScheduleView`에 전달한다.
3. `ScheduleView`는 `useSchedules(roomId)`를 호출한다.
4. `useSchedules`는 Supabase에서 `room_id`가 현재 방과 일치하는 일정만 조회한다.
5. 조회된 일정 목록을 화면에 표시한다.

### 7.2 일정 생성

1. 사용자가 일정 추가 버튼을 클릭한다.
2. `ScheduleFormModal`이 열린다.
3. 사용자가 제목, 날짜, 설명을 입력한다.
4. 저장 시 제목과 날짜를 검증한다.
5. `useSchedules.createSchedule()`이 Supabase에 insert 요청을 보낸다.
6. 저장 성공 시 일정 목록에 반영한다.
7. 같은 방의 다른 사용자에게 Realtime 이벤트로 변경 사항이 전달된다.

### 7.3 일정 수정

1. 사용자가 기존 일정의 수정 버튼을 클릭한다.
2. `ScheduleFormModal`에 기존 일정 정보가 표시된다.
3. 사용자가 내용을 수정하고 저장한다.
4. `useSchedules.updateSchedule()`이 Supabase update 요청을 보낸다.
5. 변경 내용이 현재 사용자와 같은 방의 다른 사용자 화면에 반영된다.

### 7.4 일정 삭제

1. 사용자가 삭제 버튼을 클릭한다.
2. 시스템은 삭제 확인 메시지를 표시한다.
3. 사용자가 확인하면 `useSchedules.deleteSchedule()`이 Supabase delete 요청을 보낸다.
4. 삭제된 일정은 현재 사용자와 같은 방의 다른 사용자 화면에서 제거된다.

---

## 8. 실시간 동기화 설계

일정 기능은 Supabase Realtime의 `postgres_changes` 이벤트를 사용한다.

- 구독 대상 테이블: `schedules`
- 구독 이벤트: `insert`, `update`, `delete`
- 필터 기준:
  - insert/update: `room_id = 현재 roomId`
  - delete: Supabase DELETE 이벤트의 old row 특성을 고려하여 id 기준으로 현재 목록에서 제거
- 반영 방식:
  - insert: 새 일정을 목록에 추가
  - update: 기존 일정 항목을 수정
  - delete: 삭제된 일정을 목록에서 제거하고, 클라이언트 broadcast로 다른 브라우저 반영을 보강

DELETE 이벤트는 Supabase/Postgres 설정에 따라 필터링과 old row 전달 방식이 insert/update보다 제한될 수 있다. 따라서 `schedules` 테이블은 `replica identity full`로 설정하고, 삭제를 수행한 클라이언트가 같은 방 채널에 `schedule_deleted` broadcast를 보내 다른 브라우저가 id 기준으로 즉시 제거하도록 보강한다.

구독은 컴포넌트가 언마운트될 때 해제하여 불필요한 중복 구독을 방지한다.

---

## 9. 아키텍처 관점

| 아키텍처 스타일 | Pungto 적용 |
|---|---|
| 클라이언트-서버 | Next.js 클라이언트가 Supabase 서버에 데이터를 요청하고 저장한다. |
| 데이터 중심 아키텍처 | 일정 데이터는 Supabase 테이블을 중심으로 관리된다. |
| 이벤트 기반 아키텍처 | 일정 변경 이벤트를 Realtime으로 구독하고 화면에 반영한다. |
| MVC 유사 분리 | View는 컴포넌트가, 데이터 처리와 상태 관리는 hook이 담당한다. |

---

## 10. 설계 대안과 선택 이유

### 대안 1. 기존 `page.tsx`에 일정 로직 직접 추가

장점:
- 구현이 빠르다.
- 기존 구조를 크게 바꾸지 않아도 된다.

단점:
- 대형 파일이 더 복잡해진다.
- 일정 기능 수정 시 전체 방 화면 코드에 영향을 줄 수 있다.
- AI가 생성한 코드가 계속 한 파일에 누적되는 기존 문제를 반복한다.

### 대안 2. 일정 기능을 컴포넌트와 hook으로 분리

장점:
- 일정 UI와 데이터 처리 로직을 분리할 수 있다.
- 유지보수성과 테스트 가능성이 높아진다.
- 기존 대형 파일의 복잡도 증가를 줄일 수 있다.
- 이후 자료, 알림, 할 일 기능도 같은 방식으로 확장할 수 있다.

단점:
- 초기 구현 시 파일 구조를 설계해야 하므로 시간이 조금 더 필요하다.

### 선택

이번 개선에서는 대안 2를 선택한다. 본 과제의 목적이 단순 기능 추가가 아니라 프로세스 기반 바이브코딩의 효과를 분석하는 것이므로, 빠른 구현보다 유지보수성, 모듈성, 테스트 가능성을 우선한다.

---

## 11. 프로세스 적용의 교훈

초기 Pungto 개발에서는 AI에게 기능 추가를 요청할 때 전체 구조보다 화면 결과를 우선하였다. 그 결과 기능이 하나의 큰 파일에 누적되고, 실제 동작 기능과 목업 기능이 혼재하는 문제가 발생하였다.

이번 설계 단계에서는 기능 구현 전에 모듈 책임, 데이터 모델, 실시간 동기화 방식, 설계 대안을 먼저 정의하였다. 이를 통해 AI에게 코드를 요청할 때도 “기존 page.tsx에 모두 추가하지 말고, 일정 관련 컴포넌트와 hook으로 분리하라”는 구조적 제약을 줄 수 있게 되었다. 즉, 프로세스를 적용하면 AI가 생성하는 코드의 방향을 더 명확히 통제할 수 있다.
