# React + Express + Docker -> Vercel + Next.js 마이그레이션 가이드

## 1. 문서 목적

이 문서는 현재 서비스의 기능과 UI를 유지한 채, 기존 `CRA + Express + Docker/nginx/EC2` 구조를 `Vercel에 배포되는 단일 Next.js App Router 애플리케이션`으로 이전하기 위한 실행 가이드입니다.

기준 원칙은 다음과 같습니다.

- 사용자 경험은 유지하고, 구조만 Next.js/Vercel 친화적으로 바꾼다.
- 서비스 URL은 기존 `/location-map-app` 서브패스가 아니라 루트 `/` 로 전환한다.
- 기존 Express 서버는 별도 서비스로 남기지 않고 Next Route Handler로 흡수한다.
- 지도, 현재 위치, 거리 정렬, 시험 일정/시험장 조회, 메타데이터/정적 자산까지 현재 범위를 모두 포함한다.
- 배포는 Docker/EC2 대신 Vercel 기준으로 정리한다.

## 2. 현재 구조 분석

### 2.1 프런트엔드 책임

현재 프런트엔드는 `location-map-app` 아래의 CRA 앱입니다.

- 진입점: `location-map-app/src/index.tsx`
- 화면/상태 조합: `location-map-app/src/App.tsx`
- 리스트 UI: `location-map-app/src/components/LocationList.tsx`
- 지도 UI: `location-map-app/src/components/Map.tsx`
- API 호출: `location-map-app/src/api/toeicAPI.ts`
- 타입: `location-map-app/src/types/index.ts`
- 상수: `location-map-app/src/constants/index.ts`
- 유틸: `location-map-app/src/utils/index.ts`, `location-map-app/src/utils/csvUtils.ts`

프런트엔드가 담당하는 기능은 다음과 같습니다.

- 시험 종류 선택
  - 현재는 `토익` 한 종류만 지원
- 시험 일정 조회
  - 외부 API를 통해 일정 목록을 가져오고 날짜 드롭다운을 생성
- 지역 필터 선택
  - 고정된 지역 목록을 기반으로 시험장 조회
- 시험장 좌표 매핑
  - `public/toeic_centers.csv` 의 센터 코드와 좌표를 읽어 API 응답과 결합
- 현재 위치 사용
  - `navigator.geolocation` 으로 사용자의 현재 위치를 구함
- 거리 계산 및 정렬
  - Haversine 거리 계산 후 가까운 시험장 순으로 정렬
- 리스트/지도 동기화
  - 리스트 클릭 시 지도 중심 이동
  - 지도 마커 클릭 시 리스트 선택 상태와 동일한 흐름 유지
- 로딩/에러 상태 처리
  - 일정 로딩, 시험장 로딩, 위치 권한 실패, CSV 로딩 실패 등

### 2.2 현재 UI 흐름

현재 화면은 데스크톱 기준 좌우 분할 단일 페이지입니다.

- 왼쪽 패널
  - 현재 위치 사용 버튼
  - 시험 종류 드롭다운
  - 시험 일정 드롭다운
  - 지역 드롭다운
  - 시험장 목록
  - 거리 정보 및 에러/로딩 상태
- 오른쪽 패널
  - Leaflet 지도
  - 시험장 마커
  - 선택된 시험장 마커 강조
  - 사용자 위치 마커

즉, 마이그레이션 후에도 `단일 페이지 + 좌우 분할 + 상호작용 중심` 구조는 그대로 유지해야 합니다.

### 2.3 백엔드 책임

현재 백엔드는 `toeic-api/index.js` 에 있는 Express 서버 하나입니다.

- `GET /api/health`
  - 서버 상태 확인용
- `GET /api/toeic`
  - 외부 TOEIC 사이트에 `proc=getReceiptScheduleList`, `examCate=TOE` 로 POST 요청
  - 시험 일정 목록을 그대로 반환
- `GET /api/toeic/centers`
  - 필수 쿼리: `examCode`, `bigArea`
  - 외부 TOEIC 사이트에 `proc=getExamAreaInfo`, `examCate=TOE`, `sbGoodsType1=TOE` 로 POST 요청
  - 지역별 시험장 목록을 반환

현재 백엔드의 핵심 역할은 브라우저에서 직접 호출하기 어려운 외부 사이트 요청을 서버에서 대신 수행하는 것입니다. 즉, 본질적으로는 `CORS 우회 + 외부 API 프록시` 역할입니다.

### 2.4 배포/인프라 책임

현재 배포 구조는 다음과 같습니다.

- `Dockerfile`
  - CRA 앱을 빌드
  - nginx 이미지에 정적 파일 복사
  - 컨테이너 안에서 Node.js 기반 API 서버도 같이 실행
- `location-map-app/nginx.conf`
  - `/location-map-app/` 에서 정적 앱 서빙
  - `/api/*` 는 내부 Express 서버로 프록시
- `start.sh`
  - API 서버 실행 후 nginx 실행
- `.github/workflows/deploy.yml`
  - Docker 이미지를 Docker Hub에 푸시
  - EC2에 SSH 접속 후 컨테이너 재기동

현재 서비스는 인프라적으로 `정적 프런트 + 내부 프록시 서버 + EC2 컨테이너 운영` 구조입니다.

### 2.5 정적 데이터와 메타데이터

현재 정적 자산은 `location-map-app/public` 아래에 있습니다.

- `toeic_centers.csv`
  - 시험장 코드와 좌표를 저장하는 핵심 정적 데이터
- `location-map.png`, `img.png`
  - 파비콘/OG 이미지 등에 사용
- `robots.txt`, `sitemap.xml`
  - 검색 엔진 노출 관련 자산
- `index.html`
  - 메타 설명, OG 메타, JSON-LD, 타이틀 포함

### 2.6 현재 구조의 핵심 제약

- CRA의 `homepage: /location-map-app` 설정에 의존한다.
- `process.env.PUBLIC_URL` 기반 정적 파일 경로를 사용한다.
- Leaflet와 geolocation이 브라우저 전용이라 SSR과 직접 호환되지 않는다.
- Express가 사실상 프록시 역할이므로 Next.js로 합치기 적합하다.
- 테스트가 거의 없어 기능 동등성 검증은 수동 검증 체크리스트가 중요하다.

## 3. 목표 아키텍처

### 3.1 목표 요약

최종 목표는 `하나의 Next.js App Router 앱`으로 프런트엔드와 프록시 API를 함께 운영하는 것입니다.

- 서비스 진입 URL: `/`
- 배포 플랫폼: Vercel
- 라우팅: Next.js App Router
- API: Next Route Handler
- 런타임: Node.js runtime
- 스타일: `styled-components` 유지
- 정적 데이터: Next `public/` 유지

이 구조에서는 브라우저가 같은 오리진의 `/api/*` 를 호출하므로, 기존처럼 별도 Express 서버와 nginx 프록시를 둘 필요가 없습니다.

### 3.2 목표 디렉터리 기준

최종 구조는 루트 기준으로 다음과 같이 잡습니다.

```text
app/
  layout.tsx
  page.tsx
  api/
    health/route.ts
    toeic/route.ts
    toeic/centers/route.ts
components/
  toeic-center-finder-client.tsx
  location-list.tsx
  map-client.tsx
lib/
  toeic-api.ts
  center-coordinates.ts
  distance.ts
  constants.ts
  types.ts
public/
  toeic_centers.csv
  location-map.png
  img.png
  robots.txt
  sitemap.xml
docs/
  vercel-nextjs-migration.md
```

핵심 원칙은 다음과 같습니다.

- `page.tsx` 는 화면 진입점만 맡는다.
- 실제 상태와 상호작용은 client component 하나가 현재 `App.tsx` 역할을 이어받는다.
- 지도는 별도 client component로 분리한다.
- API 프록시 로직은 Route Handler에서 관리한다.
- 기존 타입/유틸은 `lib/` 로 재배치해 공유한다.

### 3.3 서버/클라이언트 경계

#### 서버에서 담당할 것

- `/api/health`
- `/api/toeic`
- `/api/toeic/centers`
- 메타데이터 선언
- 정적 자산 제공

#### 클라이언트에서 담당할 것

- 현재 위치 요청
- 드롭다운 상태 관리
- 시험장 목록 선택 상태
- 거리 계산 결과를 반영한 정렬
- Leaflet 지도 렌더링
- 마커 클릭 및 지도 중심 이동

이 경계를 유지하면 SSR 제약이 있는 브라우저 API를 안전하게 다루면서도, 기존 UX를 거의 그대로 이식할 수 있습니다.

### 3.4 API 엔드포인트 매핑

기존 Express 경로는 다음과 같이 Next Route Handler로 그대로 유지합니다.

| 기존 | 목표 | 역할 |
| --- | --- | --- |
| `/api/health` | `/api/health` | 헬스 체크 |
| `/api/toeic` | `/api/toeic` | 시험 일정 조회 프록시 |
| `/api/toeic/centers` | `/api/toeic/centers` | 시험장 조회 프록시 |

구현 방침:

- 경로 이름은 유지한다.
- 응답 형식도 최대한 그대로 유지한다.
- `examCode`, `bigArea` 파라미터 검증은 Route Handler에서 수행한다.
- 외부 TOEIC 요청 시 현재 Express와 동일한 `User-Agent`, `Referer`, `Content-Type` 헤더를 유지한다.
- 현재와 동일하게 타임아웃과 에러 응답을 문서화한다.

### 3.5 정적 자산 및 메타데이터 이전 규칙

- `toeic_centers.csv` 는 `public/toeic_centers.csv` 로 유지한다.
- 기존 `process.env.PUBLIC_URL` 사용은 제거하고, 루트 기준 `/toeic_centers.csv` 로 fetch 한다.
- `location-map.png`, `img.png` 는 Next `public/` 으로 옮긴다.
- `index.html` 의 메타 태그는 `app/layout.tsx` 의 `metadata` 로 이전한다.
- `robots.txt`, `sitemap.xml` 은 우선 `public/` 유지 기준으로 문서화한다.

### 3.6 스타일 전략

현재 UI의 시각적 동일성이 중요하므로, 마이그레이션 시 CSS 체계를 바꾸지 않습니다.

- `styled-components` 유지
- App Router 환경에 맞는 SSR registry 추가
- 현재 좌우 레이아웃, 리스트 패널 폭, 지도 영역 비율, 선택/호버 스타일, 스피너 스타일을 최대한 동일하게 유지

### 3.7 Leaflet 전략

Leaflet는 브라우저 전용 동작이 강하므로 다음 전략을 사용합니다.

- 지도 컴포넌트는 `use client` 로 분리
- `dynamic import` 와 `ssr: false` 조합으로 렌더링
- 마커 아이콘, 사용자 위치 마커, 선택된 마커 강조는 현재와 동일한 동작 유지
- 지도 CSS는 client component 경계 안에서 안전하게 로드

## 4. 단계별 마이그레이션 절차

### 4.1 1단계: Next 앱 초기화

- 루트에 Next.js App Router 프로젝트 구조를 만든다.
- TypeScript, ESLint, `styled-components` 기반으로 시작한다.
- 서비스 진입 경로를 `/` 로 맞춘다.
- 기존 `homepage` 및 서브패스 전제는 제거한다.

### 4.2 2단계: 타입/상수/유틸 이관

다음 책임을 `lib/` 로 이동한다.

- `Location`, `ExamSchedule`, `ApiCenterInfo` 타입
- 시험 종류/지역/기본 지도 위치 상수
- 거리 계산 및 거리 포맷 유틸
- CSV 로딩 유틸

구현 방침:

- `decodeHtmlEntities` 는 현재와 동일하게 프런트 fetch helper에서 처리한다.
- CSV 로딩 경로는 `/toeic_centers.csv` 로 단순화한다.

### 4.3 3단계: Route Handler 이관

`toeic-api/index.js` 의 책임을 다음 파일로 분리한다.

- `app/api/health/route.ts`
- `app/api/toeic/route.ts`
- `app/api/toeic/centers/route.ts`

구현 방침:

- 외부 TOEIC 사이트 호출은 Route Handler 내부에서 수행한다.
- 현재 Express와 같은 form-urlencoded 요청 형식을 유지한다.
- `examCode`, `bigArea` 누락 시 `400` 을 반환한다.
- 외부 응답 없음은 `404`, 프록시 실패는 `500` 으로 유지한다.
- Vercel 배포를 고려해 Node.js runtime을 명시한다.

### 4.4 4단계: 화면 이관

현재 `App.tsx` 의 상태 로직을 client component 한 곳으로 옮긴다.

이 컴포넌트가 책임질 항목:

- 시험 종류, 시험 일정, 지역 필터 상태
- 현재 위치 상태
- 선택된 시험장 상태
- 정렬된 시험장 목록 상태
- 로딩/에러 상태
- API 호출과 CSV 결합 흐름

분리 규칙:

- 리스트는 presentational component에 가깝게 유지
- 지도는 별도 client component로 유지
- 페이지 엔트리인 `app/page.tsx` 는 client component를 렌더링하는 얇은 레이어만 담당

### 4.5 5단계: 메타데이터 및 정적 자산 이전

- `index.html` 의 타이틀, 설명, OG 설정을 `metadata` 로 옮긴다.
- `location-map.png`, `img.png`, `robots.txt`, `sitemap.xml` 을 Next public 기준으로 옮긴다.
- JSON-LD가 꼭 필요하면 `layout.tsx` 또는 페이지 레벨에서 삽입한다.

### 4.6 6단계: Vercel 배포 전환

기존 배포 책임을 다음처럼 바꾼다.

- Dockerfile 제거
- nginx 설정 제거
- Express 서버 제거
- GitHub Actions 기반 EC2 배포 제거
- Vercel 프로젝트 연결
- 도메인 연결
- 루트 URL `/` 기준 서비스 검증

전환 체크리스트:

1. Vercel 프로젝트 생성
2. 루트 디렉터리를 Next 앱으로 설정
3. 프로덕션 배포 후 `/api/health` 확인
4. `/api/toeic` 와 `/api/toeic/centers` 호출 확인
5. 정적 자산과 메타데이터 확인
6. 커스텀 도메인 연결
7. 최종 전환 후 기존 EC2/Docker 자원 정리

## 5. 위험 요소와 대응

### 5.1 Leaflet SSR 문제

위험:

- 서버 렌더링 시 Leaflet가 `window` 의존으로 실패할 수 있음

대응:

- 지도 컴포넌트를 client-only로 분리
- `dynamic import` 와 `ssr: false` 를 명시

### 5.2 브라우저 전용 geolocation

위험:

- 서버 환경에서는 `navigator.geolocation` 을 사용할 수 없음

대응:

- 위치 요청 로직은 반드시 client component 안에만 둔다
- 권한 실패와 타임아웃 메시지는 현재 UX를 유지한다

### 5.3 외부 TOEIC 응답 지연

위험:

- 외부 사이트가 느리거나 점검 중이면 응답 실패가 발생할 수 있음

대응:

- Route Handler에서 타임아웃을 둔다
- `404`/`500` 에러 분기와 에러 메시지 규약을 유지한다
- 문서에 운영 리스크로 명시한다

### 5.4 정적 파일 경로 변화

위험:

- CRA의 `PUBLIC_URL` 전제가 사라지면서 CSV/아이콘 경로가 깨질 수 있음

대응:

- 모든 정적 자산 경로를 루트 기준으로 정리한다
- 배포 후 실제 브라우저에서 CSV와 아이콘 로딩을 확인한다

### 5.5 스타일 SSR 처리

위험:

- `styled-components` 를 App Router에 그대로 옮기면 초기 스타일 누락이 생길 수 있음

대응:

- 공식 SSR registry 패턴을 사용한다
- 초기 렌더 시 레이아웃 깨짐 여부를 검증한다

## 6. 검증 체크리스트

### 6.1 기능 동등성

- 첫 진입 시 좌우 분할 레이아웃이 유지된다.
- 시험 종류 드롭다운에 현재 `토익` 이 노출된다.
- 시험 일정 조회가 정상 동작한다.
- 지역 선택 후 시험장 목록이 노출된다.
- CSV 좌표와 외부 API 응답이 정상 결합된다.
- 현재 위치 요청 후 거리순 정렬이 적용된다.
- 거리 표기가 `m` 또는 `km` 로 기존과 동일하게 표시된다.
- 리스트 클릭 시 지도 중심이 이동한다.
- 지도 마커 클릭 시 선택 상태가 동기화된다.
- 선택된 마커가 기본 마커와 시각적으로 구분된다.
- 사용자 위치 마커가 별도로 표시된다.
- 좌표가 없는 센터는 지도 마커가 생성되지 않는다.

### 6.2 UI 동등성

- 좌측 패널 폭과 배경색, 구분선, 스크롤 동작이 기존과 유사하다.
- 드롭다운과 버튼의 순서가 동일하다.
- 로딩 스피너가 기존과 유사하게 동작한다.
- 에러 메시지가 기존과 동일한 맥락으로 노출된다.
- 지도 영역이 화면의 나머지 폭을 채운다.

### 6.3 API 동등성

- `/api/health` 가 상태 JSON을 반환한다.
- `/api/toeic` 가 일정 목록을 반환한다.
- `/api/toeic/centers` 가 `examCode`, `bigArea` 기반 응답을 반환한다.
- 파라미터 누락 시 `400` 을 반환한다.
- 외부 응답 실패 시 `500` 을 반환한다.

### 6.4 운영 전환 체크

- 프로덕션 배포 후 루트 `/` 에서 앱이 열린다.
- `/location-map-app` 서브패스 의존이 남아 있지 않다.
- CSV, OG 이미지, 파비콘, robots, sitemap 이 정상 노출된다.
- 커스텀 도메인 연결 후 HTTPS가 정상 동작한다.
- 기존 Docker/EC2 경로를 더 이상 참조하지 않는다.

## 7. 구현 시 권장 순서

문서 기준 구현 순서는 다음이 가장 안전합니다.

1. Next 앱 스캐폴딩
2. 타입/상수/유틸 이관
3. Route Handler 이관
4. 페이지 상태 로직 이관
5. 지도 분리 및 client-only 처리
6. 정적 자산과 메타데이터 이전
7. 수동 기능 검증
8. Vercel 배포 및 도메인 전환
9. 최종 전환 후 레거시 제거

## 8. 범위와 비범위

### 이번 마이그레이션 범위

- 현재 서비스 기능 100% 보존
- 현재 UI 흐름 보존
- 루트 경로 `/` 전환
- Express 제거 및 Next API 흡수
- Docker/EC2 배포 제거
- Vercel 기준 배포 문서화

### 이번 문서 범위 밖

- 새로운 시험 종류 추가
- 디자인 리뉴얼
- 관리자 기능
- 데이터베이스 도입
- 인증/인가 추가
- 자동화 테스트 대규모 구축

## 9. 최종 결론

이 프로젝트는 구조적으로 `프런트엔드 앱 + CORS 우회용 Express 프록시 + Docker/nginx 배포` 로 이루어져 있으며, 실제 기능 범위는 단일 페이지 안에 집중되어 있습니다. 따라서 `Vercel에 배포되는 단일 Next.js App Router 앱`으로 통합하기에 적합합니다.

핵심은 새 기능을 추가하는 것이 아니라 다음 네 가지를 안전하게 옮기는 것입니다.

- 현재 UI 구조
- 현재 상태 전이 흐름
- 외부 TOEIC 프록시 API
- 정적 CSV 기반 좌표 매핑

즉, 이번 마이그레이션은 “기능 확장”보다 “동일 기능의 런타임/배포 구조 재편”에 가깝습니다. 구현은 `기능 동등성` 과 `UI 동등성` 을 기준으로 판단해야 하며, 배포는 최종적으로 Vercel 하나로 단순화하는 방향을 채택합니다.
