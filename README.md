# FE-Agent

[![CI](https://github.com/ParkRhtn/FE-Agent/actions/workflows/ci.yml/badge.svg)](https://github.com/ParkRhtn/FE-Agent/actions/workflows/ci.yml)

BE-Agent(`../BE-Agent`)용 Next.js 프론트엔드. Vercel AI SDK `useChat` 으로 에이전트 응답을 스트리밍한다.

## 스택

Next.js 16 (App Router) · React 19 · Vercel AI SDK 7 · React Flow 12 · shadcn/ui · Tailwind CSS 4 · openapi-typescript + openapi-fetch

## 빠른 시작

```bash
cp .env.example .env.local
pnpm install
pnpm dev                   # http://localhost:3000 (백엔드가 8000 에서 떠 있어야 함)
```

## 구조

```
src/
├── app/
│   ├── (main)/                         # 사이드바가 있는 화면들
│   │   ├── layout.tsx                  # 왼쪽 메뉴 사이드바 + 본문
│   │   ├── settings/                   # 모델 제공사·기본 모델 설정
│   │   ├── chat/                       # 대화 + 에이전트 (왼쪽 에이전트·최근 대화, 오른쪽 에이전트 설정 패널)
│   │   ├── workflows/                  # 워크플로우 목록 / React Flow 편집기
│   ├── login/                          # 로그인 화면 + Server Actions
│   ├── auth/logout/route.ts            # 쿠키 삭제 후 /login
│   └── api/backend/[...path]/route.ts  # BFF 프록시: 브라우저 → Next → FastAPI (JWT 주입, SSE 그대로 전달)
├── proxy.ts                            # 미로그인 시 /login 으로
├── components/app-sidebar.tsx          # 왼쪽 메뉴 (메뉴 추가는 NAV 배열에), 접기, 계정 메뉴
├── components/workflow/                # 편집기(캔버스·실행 패널), 노드 모양, 노드 설정 패널
├── components/chat/
│   ├── chat.tsx                        # useChat + DefaultChatTransport
│   └── message.tsx                     # 텍스트 / 도구 호출 파트 렌더링
├── lib/workflow.ts                     # 노드 종류 정의, React Flow ↔ 백엔드 그래프 변환
└── lib/api/
    ├── schema.d.ts                     # 백엔드 OpenAPI 로 자동 생성 (직접 수정 금지)
    ├── server.ts                       # 서버 컴포넌트용 타입 안전 클라이언트
    └── client.ts                       # 브라우저용 클라이언트 (BFF 경유)
```

브라우저는 백엔드를 직접 호출하지 않고 항상 `/api/backend/*` 를 거친다.

## 인증

- `/login` 에서 Server Action 으로 백엔드 로그인 → JWT 를 httpOnly 쿠키(`token`)에 저장
- `src/proxy.ts`: 쿠키가 없거나 만료면 `/login?next=...` 로 보냄 (서명 검증은 백엔드 몫)
- BFF 프록시와 서버 컴포넌트 클라이언트(`lib/api/server.ts`)가 쿠키를 `Authorization` 헤더로 옮김
- 백엔드가 401 을 주면 `/auth/logout` 에서 쿠키를 지우고 로그인 화면으로

## 백엔드 API 타입 갱신

백엔드 스키마가 바뀌면 백엔드를 띄운 상태에서:

```bash
pnpm gen:api
pnpm typecheck
```
