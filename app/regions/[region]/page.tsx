import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getRegionPageSummaries } from "@/lib/landing-data";
import { getRegionIntro } from "@/lib/region-content";
import { decodeRouteSegment } from "@/lib/route-utils";
import {
  buildBreadcrumbStructuredData,
  buildCollectionPageStructuredData,
  buildFaqStructuredData,
  buildPageMetadata,
} from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCATION_FILTERS.map((region) => ({ region }));
}

const isValidRegion = (region: string): boolean =>
  LOCATION_FILTERS.includes(region as (typeof LOCATION_FILTERS)[number]);

interface RegionPageProps {
  params: Promise<{
    region: string;
  }>;
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { region: rawRegion } = await params;
  const region = decodeRouteSegment(rawRegion);

  if (!isValidRegion(region)) {
    return buildPageMetadata({
      title: "토익 시험장 찾기",
      description: "토익 시험장 찾기 페이지입니다.",
      path: "/regions",
    });
  }

  return buildPageMetadata({
    title: `${region} 토익 시험장 찾기`,
    description: `${region} 지역 토익 시험장과 활성 시험일별 랜딩 페이지를 확인할 수 있습니다.`,
    path: `/regions/${region}`,
    keywords: [`${region} 토익 시험장`, `${region} 토익 고사장`],
  });
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { region: rawRegion } = await params;
  const region = decodeRouteSegment(rawRegion);

  if (!isValidRegion(region)) {
    notFound();
  }

  const summaries = await getRegionPageSummaries(region);
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "지역별 토익 시험장", href: "/regions" },
    { label: `${region} 토익 시험장` },
  ];
  const intro = getRegionIntro(region);

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "지역별 토익 시험장", path: "/regions" },
          { name: `${region} 토익 시험장`, path: `/regions/${region}` },
        ])}
      />
      <JsonLd
        data={buildCollectionPageStructuredData({
          name: `${region} 토익 시험장`,
          description: intro,
          path: `/regions/${region}`,
          itemNames: summaries.map((summary) => `${summary.examDate} ${region} 토익 시험장`),
        })}
      />
      <JsonLd
        data={buildFaqStructuredData([
          {
            question: `${region} 토익 시험장은 어디서 확인하나요?`,
            answer: `이 페이지에서 활성 시험일별 링크를 선택하면 ${region} 지역 토익 시험장 요약 페이지로 바로 이동할 수 있습니다. 각 시험일 페이지에는 대표 시험장명, 주소, 시험장 수가 함께 제공됩니다.`,
          },
        ])}
      />

      <section className="page-hero">
        <p className="page-kicker">{region} 지역 랜딩</p>
        <h1>{region} 토익 시험장 찾기</h1>
        <p className="page-lead">{intro}</p>
        <div className="page-actions">
          {summaries[0] ? (
            <Link
              className="page-button"
              href={`/regions/${region}/dates/${summaries[0].examDate}`}
            >
              가장 가까운 시험일 보기
            </Link>
          ) : (
            <Link className="page-button" href="#finder-tool">
              검색 도구로 바로 이동
            </Link>
          )}
          <Link className="page-button secondary" href="/regions">
            다른 지역 보기
          </Link>
        </div>
      </section>

      <section className="page-answer-box">
        <h2>{region} 토익 시험장은 어디서 확인하나요?</h2>
        <p className="page-answer">
          이 페이지에서 활성 시험일별 링크를 선택하면 {region} 지역 토익 시험장
          요약 페이지로 바로 이동할 수 있습니다. 각 시험일 페이지에는 대표
          시험장명, 주소, 시험장 수, 검색 도구 연결 링크가 함께 제공됩니다.
        </p>
      </section>

      <section className="page-section">
        <div className="page-section-header">
          <h2>시험일별 {region} 토익 시험장</h2>
          <p className="page-copy">
            공개된 시험장이 있는 일정만 노출합니다. 원하는 시험일을 선택하면
            대표 시험장과 주소를 포함한 상세 랜딩 페이지로 이동합니다.
          </p>
        </div>

        {summaries.length > 0 ? (
          <table className="page-table">
            <thead>
              <tr>
                <th>시험일</th>
                <th>시험장 수</th>
                <th>대표 시험장</th>
                <th>이동</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.examDate}>
                  <td>{summary.examDate}</td>
                  <td>{summary.centerCount}곳</td>
                  <td>
                    {summary.topCenters.map((center) => center.center_name).join(", ")}
                  </td>
                  <td>
                    <Link
                      className="page-chip-link"
                      href={`/regions/${region}/dates/${summary.examDate}`}
                    >
                      시험일 페이지 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="page-copy">
            현재 공개된 {region} 시험장 데이터가 없어 검색 도구에서 직접 확인하는
            흐름을 우선 제공합니다.
          </p>
        )}
      </section>

      <section className="page-section finder-section" id="finder-tool">
        <div className="page-section-header">
          <h2>{region} 시험장 검색 도구</h2>
          <p className="page-copy">
            실시간 필터링이 필요하면 아래 검색 도구에서 시험일과 지역을 선택해
            확인하세요.
          </p>
        </div>
        <div className="page-actions">
          <Link className="page-button" href={`/#finder-tool`}>
            홈 검색 도구로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
