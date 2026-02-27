# Shadowball — 설계 문서
> OpenClaw 에이전트 모니터링 + 포켓몬 프로젝트 관리 대시보드

## 개요
- **앱 이름**: Shadowball
- **마스코트**: 다크라이
- **목적**: OpenClaw 서브에이전트들이 뭘 하는지 실시간으로 보고, 프로젝트 진행도를 포켓몬 진화로 gamify
- **오픈소스**: GitHub 공개 예정 (OpenClaw 전용 시작 → 어댑터로 확장)
- **스택**: Next.js + Vercel + Supabase

---

## 핵심 루프
1. 프로젝트 생성 → 랜덤 포켓몬 알 배정
2. 에이전트가 작업 시작 → 알 부화 (스프라이트 등장)
3. 진행도 0~50% → 1차 진화 전 스프라이트
4. 진행도 50~100% → 1차 진화 스프라이트
5. 완료 → 최종 진화 + 포켓덱스 등록
6. 2주 이상 업데이트 없음 → 지친 애니메이션 + 말풍선 "...저 언제 써요?"

---

## MVP 기능 (v1)
- 프로젝트 카드 (이름, 진행도, 포켓몬 스프라이트)
- 에이전트 작업 목록 (실시간 상태: 대기/실행중/완료/실패)
- 진행도 바 (에이전트가 Supabase에 직접 write)
- 방치 감지 (마지막 업데이트 기준)
- 다크라이 마스코트 헤더

## v2 이후
- 포켓덱스 (완료 프로젝트 도감)
- 에이전트 로그 뷰어
- 타임라인 뷰
- 다중 사용자 (오픈소스 공개 시)

---

## 데이터 구조 (Supabase)

### projects
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | 프로젝트명 |
| description | text | 설명 |
| progress | int | 0~100 |
| pokemon_id | int | PokeAPI 포켓몬 번호 |
| status | enum | pending/active/done/abandoned |
| created_at | timestamp | |
| last_updated_at | timestamp | 방치 감지 기준 |

### tasks
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| project_id | uuid | FK |
| agent_label | text | 에이전트 라벨 |
| title | text | 작업명 |
| status | enum | queued/running/done/failed |
| started_at | timestamp | |
| ended_at | timestamp | |
| result | text | 결과 요약 |

---

## 포켓몬 진화 로직
- 진행도 0% → 알 (egg sprite)
- 진행도 1~49% → 1단계 스프라이트
- 진행도 50~99% → 2단계 스프라이트 (진화)
- 진행도 100% → 최종 진화 + 완료 애니메이션
- last_updated_at이 14일 이상 지나면 → exhausted 상태 (CSS 필터 + 말풍선)

스프라이트 소스: PokeAPI
`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`

---

## OpenClaw 연동 방식
에이전트 작업 시작/완료 시 Supabase REST API로 직접 write:
```python
import httpx
SUPABASE_URL = "https://xxx.supabase.co"
SUPABASE_KEY = "..."

# 작업 시작
httpx.post(f"{SUPABASE_URL}/rest/v1/tasks", json={...}, headers={"apikey": SUPABASE_KEY})

# 진행도 업데이트
httpx.patch(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}", json={"progress": 50})
```

---

## 디렉토리 구조
```
shadowball/
├── app/
│   ├── page.tsx          # 메인 대시보드
│   ├── project/[id]/     # 프로젝트 상세
│   └── layout.tsx
├── components/
│   ├── ProjectCard.tsx   # 포켓몬 카드
│   ├── PokemonSprite.tsx # 스프라이트 + 진화 로직
│   ├── TaskList.tsx      # 에이전트 작업 목록
│   └── Darkrai.tsx       # 마스코트 헤더
├── lib/
│   ├── supabase.ts
│   └── pokemon.ts        # PokeAPI 유틸
└── README.md
```

---

## 디자인 무드
- 다크 모드 기본
- 다크라이 컬러: 검정 + 흰색 + 청록(#00E5FF) 포인트
- 포켓몬 스프라이트: GBA 픽셀 스타일 (generation-iii sprites)
- 타이포: 모노스페이스 계열 (터미널 느낌)
