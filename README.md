# 내 근처 토익 시험장 찾기

단일 `Next.js App Router` 앱으로 운영되는 토익 시험장 검색 서비스입니다.  
시험 일정 조회, 지역별 시험장 조회, CSV 좌표 매핑, 현재 위치 기반 거리 정렬, Leaflet 지도 동기화를 한 앱 안에서 제공합니다.

배포 기준 URL은 루트 `/` 이며, 기존 `/location-map-app` 서브패스 의존성은 제거되었습니다.

## 기술 스택

- Next.js App Router
- React 19
- TypeScript
- styled-components
- Leaflet / react-leaflet
- Playwright
- Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

앱은 기본적으로 `http://127.0.0.1:3000` 에서 실행됩니다.

## 환경변수

`.env.example` 기준:

```bash
NEXT_PUBLIC_SITE_URL=https://bevibing.duckdns.org
TOEIC_UPSTREAM_BASE_URL=https://m.exam.toeic.co.kr/receipt/centerMapProc.php
TOEIC_PROXY_TIMEOUT_MS=15000
```

- `NEXT_PUBLIC_SITE_URL`: canonical, OG, sitemap, robots 기준 URL
- `TOEIC_UPSTREAM_BASE_URL`: TOEIC 프록시 대상 엔드포인트
- `TOEIC_PROXY_TIMEOUT_MS`: 프록시 타임아웃(ms)

## 검증

기본 검증은 mock upstream 기반 Playwright E2E입니다.

```bash
npm run test:centers
npm run build
npm run test:e2e
```

실서비스 스모크는 수동 실행용입니다.

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:live
```

`test:e2e:live` 실행 전에는 실제 upstream 을 바라보는 앱 서버가 이미 떠 있어야 합니다.

## 시험장 CSV 자동 갱신

정적 CSV는 자동 갱신 스크립트로 유지합니다.

```bash
npm run centers:check
npm run centers:refresh
```

- `centers:check`
  - 현재 CSV, 리포트, 상태 파일과 비교만 수행합니다.
  - 저장소 파일은 수정하지 않고, 변경이 있으면 종료 코드 `1` 을 반환합니다.
- `centers:refresh`
  - 공식 TOEIC upstream 을 기준으로 `public/toeic_centers.csv` 를 갱신합니다.
  - 리포트와 상태 파일도 함께 갱신합니다.

CLI 옵션:

```bash
node scripts/update-toeic-centers.mjs --check
node scripts/update-toeic-centers.mjs --csv public/toeic_centers.csv
node scripts/update-toeic-centers.mjs --report reports/toeic-centers-report.json
```

- `--check`: 쓰기 없이 비교만 수행
- `--csv <path>`: 대상 CSV 경로
- `--report <path>`: JSON 리포트 경로
  - 같은 basename 으로 Markdown 리포트도 함께 생성됩니다.

리포트 파일:

- `reports/toeic-centers-report.json`
  - `newCenters[]`, `staleCenters[]`, `changedMetadata[]`, `manualReview[]` 포함
- `reports/toeic-centers-report.md`
  - 사람이 읽기 쉬운 요약
- `reports/toeic-centers-state.json`
  - 다음 실행에서 이름/주소 변경을 감지하기 위한 내부 상태 파일

정책:

- 기준 범위는 앱 드롭다운에 실제로 노출되는 모든 시험일입니다.
- 신규 센터는 CSV 끝에 자동 append 합니다.
- 공식 목록에서 사라진 센터는 CSV에서 삭제하지 않고 `stale candidate` 로만 보고합니다.
- 공식 좌표가 비어 있거나 비정상 형식이면 CSV에 자동 추가하지 않고 `manualReview` 로 남깁니다.

## Vercel 배포

- Vercel 프로젝트 루트는 저장소 루트(`/Users/tak/toeic-center-finder`)입니다.
- Framework Preset 은 Next.js 를 사용합니다.
- 프로덕션 환경변수로 `NEXT_PUBLIC_SITE_URL` 을 실제 도메인에 맞게 설정합니다.
- 필요 시 `TOEIC_PROXY_TIMEOUT_MS` 를 운영 환경에 맞춰 조정합니다.
- 로컬 CLI 링크 기준 프로젝트 정보는 `.vercel/project.json` 에 생성되며, GitHub Actions 에서는 같은 값을 시크릿으로 사용합니다.

## GitHub Actions Vercel 자동 배포

- `.github/workflows/vercel-preview.yml`
  - PR 오픈/업데이트 시 preview 배포
  - draft PR 과 포크 PR 은 시크릿 보호를 위해 자동 배포하지 않음
- `.github/workflows/vercel-production.yml`
  - `main` 브랜치 push 시 production 배포
  - 수동 실행(`workflow_dispatch`) 가능

GitHub repository secrets:

```bash
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

설정 순서:

1. Vercel에서 access token 을 발급합니다.
2. 로컬에서 `vercel link` 를 실행해 프로젝트를 연결합니다.
3. 생성된 `.vercel/project.json` 에서 `orgId`, `projectId` 값을 확인합니다.
4. GitHub 저장소의 `Settings > Secrets and variables > Actions` 에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 를 등록합니다.
5. Vercel 프로젝트 환경변수에도 `NEXT_PUBLIC_SITE_URL`, 필요 시 `TOEIC_PROXY_TIMEOUT_MS` 를 등록합니다.

운영 메모:

- 이 자동화는 Vercel 공식 GitHub Actions 방식인 `vercel pull` + `vercel build` + `vercel deploy --prebuilt` 흐름을 사용합니다.
- 나중에 Vercel Git Integration 을 연결하면 GitHub Actions 와 중복 배포가 생길 수 있으니 한쪽만 활성화하는 편이 안전합니다.
- `main` 브랜치에는 GitHub Branch Protection 을 걸고 `CI` 워크플로 성공을 필수 status check 로 두는 편이 안전합니다.

## GitHub Actions 자동 갱신

- `.github/workflows/refresh-toeic-centers.yml`
  - 주 1회 실행
  - 수동 실행(`workflow_dispatch`) 가능
  - 변경이 있으면 CSV/리포트/상태 파일을 담은 PR을 자동 생성

## 참고 문서

- [Vercel + Next.js 마이그레이션 가이드](docs/vercel-nextjs-migration.md)
