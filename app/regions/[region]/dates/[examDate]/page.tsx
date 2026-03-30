import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { getAvailableRegionDateLanding, getExamDateLabel, getRegionPageSummaries } from "@/lib/landing-data";
import { getRegionIntro } from "@/lib/region-content";
import { decodeRouteSegment } from "@/lib/route-utils";
import {
  buildBreadcrumbStructuredData,
  buildCollectionPageStructuredData,
  buildFaqStructuredData,
  buildPageMetadata,
} from "@/lib/site";

export const revalidate = 3600;

interface RegionDatePageProps {
  params: Promise<{
    examDate: string;
    region: string;
  }>;
}

export async function generateMetadata({
  params,
}: RegionDatePageProps): Promise<Metadata> {
  const { region: rawRegion, examDate: rawExamDate } = await params;
  const region = decodeRouteSegment(rawRegion);
  const examDate = decodeRouteSegment(rawExamDate);
  const landingData = await getAvailableRegionDateLanding(region, examDate);

  if (!landingData) {
    return buildPageMetadata({
      title: "토익 시험장 찾기",
      description: "토익 시험장 찾기 페이지입니다.",
      path: "/regions",
    });
  }

  return buildPageMetadata({
    title: `${examDate} ${region} 토익 시험장`,
    description: `${examDate} 시험일 기준 ${region} 토익 시험장 ${landingData.centers.length}곳과 대표 주소를 확인할 수 있습니다.`,
    path: `/regions/${region}/dates/${examDate}`,
    keywords: [`${region} 토익 시험장`, `${examDate} 토익 시험장`, `${region} 토익 시험일`],
  });
}

export default async function RegionDatePage({ params }: RegionDatePageProps) {
  const { region: rawRegion, examDate: rawExamDate } = await params;
  const region = decodeRouteSegment(rawRegion);
  const examDate = decodeRouteSegment(rawExamDate);
  const landingData = await getAvailableRegionDateLanding(region, examDate);

  if (!landingData) {
    notFound();
  }

  const relatedDates = (await getRegionPageSummaries(region))
    .filter((summary) => summary.examDate !== examDate)
    .slice(0, 4);
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "지역별 토익 시험장", href: "/regions" },
    { label: `${region} 토익 시험장`, href: `/regions/${region}` },
    { label: examDate },
  ];
  const examDateLabel = getExamDateLabel(examDate);
  const intro = getRegionIntro(region);

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "지역별 토익 시험장", path: "/regions" },
          { name: `${region} 토익 시험장`, path: `/regions/${region}` },
          { name: examDate, path: `/regions/${region}/dates/${examDate}` },
        ])}
      />
      <JsonLd
        data={buildCollectionPageStructuredData({
          name: `${examDate} ${region} 토익 시험장`,
          description: `${examDateLabel}에 응시 가능한 ${region} 지역 토익 시험장 목록입니다.`,
          path: `/regions/${region}/dates/${examDate}`,
          itemNames: landingData.centers.map((center) => center.center_name),
        })}
      />
      <JsonLd
        data={buildFaqStructuredData([
          {
            question: `${region}에서 ${examDateLabel} 토익 시험장은 어디서 보나요?`,
            answer: `이 페이지에서 ${region} 지역 시험장 이름과 주소를 먼저 확인한 뒤, 아래 검색 도구로 이동하면 같은 시험일과 지역이 자동으로 선택된 상태에서 지도와 거리 기준 정렬까지 이어서 볼 수 있습니다.`,
          },
        ])}
      />

      <section className="page-hero">
        <p className="page-kicker">{region} · {examDateLabel}</p>
        <h1>{examDate} {region} 토익 시험장</h1>
        <p className="page-lead">
          {examDateLabel} 기준으로 확인 가능한 {region} 토익 시험장 페이지입니다.
          대표 시험장명과 주소를 먼저 확인한 뒤, 아래 검색 도구에서 현재 위치
          기준 가까운 시험장을 다시 정렬해 볼 수 있습니다.
        </p>
        <div className="page-meta">
          <span>시험장 {landingData.centers.length}곳</span>
          <span>{region} 지역</span>
          <span>시험일 {examDate}</span>
        </div>
      </section>

      <section className="page-answer-box">
        <h2>{region}에서 {examDateLabel} 토익 시험장은 어디서 보나요?</h2>
        <p className="page-answer">
          이 페이지에서 {region} 지역 시험장 이름과 주소를 먼저 확인한 뒤, 아래
          검색 도구로 이동하면 같은 시험일과 지역이 자동으로 선택된 상태에서
          지도와 거리 기준 정렬까지 이어서 볼 수 있습니다. {intro}
        </p>
      </section>

      <section className="page-section">
        <div className="page-section-header">
          <h2>{examDate} {region} 시험장 요약</h2>
          <p className="page-copy">
            대표 시험장명과 주소를 먼저 확인할 수 있습니다.
          </p>
        </div>
        <table className="page-table">
          <thead>
            <tr>
              <th>시험장명</th>
              <th>주소</th>
            </tr>
          </thead>
          <tbody>
            {landingData.centers.map((center) => (
              <tr key={center.center_code}>
                <td>{center.center_name}</td>
                <td>{center.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {relatedDates.length > 0 ? (
        <section className="page-section">
          <div className="page-section-header">
            <h2>다른 시험일 보기</h2>
            <p className="page-copy">
              같은 지역의 다른 활성 시험일 페이지도 함께 비교할 수 있습니다.
            </p>
          </div>
          <div className="page-chip-list">
            {relatedDates.map((summary) => (
              <Link
                key={summary.examDate}
                className="page-chip-link"
                href={`/regions/${region}/dates/${summary.examDate}`}
              >
                {summary.examDate}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="finder-section" id="finder-tool">
        <div className="finder-frame">
          <ToeicCenterFinderClient
            initialExamDate={examDate}
            initialLocationFilter={region}
          />
        </div>
      </section>
    </main>
  );
}
