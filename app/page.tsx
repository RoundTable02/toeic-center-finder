import Link from "next/link";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getActiveSchedules } from "@/lib/landing-data";

export const revalidate = 3600;

export default async function HomePage() {
  const schedules = await getActiveSchedules();
  const featuredRegions = LOCATION_FILTERS.slice(0, 8);
  const upcomingSchedules = schedules.slice(0, 3);

  return (
    <main className="page-shell">
      <section className="page-hero">
        <p className="page-kicker">전국 토익 시험장 검색</p>
        <h1>토익 시험장 찾기와 시험 일정 확인을 한 번에</h1>
        <p className="page-lead">
          지역별 토익 시험장과 시험일별 응시 가능 센터를 한 페이지에서 빠르게
          찾을 수 있습니다. 현재 위치를 사용하면 가까운 시험장 순으로 정렬되어,
          신청 전에 이동 동선까지 함께 확인할 수 있습니다.
        </p>
        <div className="page-actions">
          <Link className="page-button" href="#finder-tool">
            지금 시험장 검색하기
          </Link>
          <Link className="page-button secondary" href="/regions">
            지역별 랜딩 페이지 보기
          </Link>
          <Link className="page-button secondary" href="/faq">
            자주 묻는 질문 보기
          </Link>
        </div>
      </section>

      <section className="page-card-grid">
        <article className="page-card">
          <h2>이 사이트에서 바로 확인할 수 있는 것</h2>
          <ul className="page-list compact">
            <li>지역별 토익 시험장 후보</li>
            <li>시험일별 응시 가능 센터 목록</li>
            <li>현재 위치 기준 가까운 순 정렬</li>
          </ul>
        </article>
        <article className="page-card">
          <h2>주요 지역으로 바로 이동</h2>
          <div className="page-chip-list">
            {featuredRegions.map((region) => (
              <Link key={region} className="page-chip-link" href={`/regions/${region}`}>
                {region} 토익 시험장
              </Link>
            ))}
          </div>
        </article>
        <article className="page-card">
          <h2>다가오는 시험일</h2>
          <div className="page-chip-list">
            {upcomingSchedules.map((schedule) => (
              <Link
                key={schedule.exam_day}
                className="page-chip-link"
                href={`/regions/서울/dates/${schedule.exam_day}`}
              >
                {schedule.displayLabel}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="page-section">
        <div className="page-section-header">
          <h2>토익 시험장은 어떻게 찾나요?</h2>
          <p className="page-copy">
            먼저 시험일을 고르고 지역을 선택하면 해당 조건에 맞는 시험장 목록이
            표시됩니다. 서울, 경기, 인천처럼 자주 찾는 지역은 별도 랜딩 페이지를
            통해 검색엔진에서도 바로 진입할 수 있게 구성했습니다.
          </p>
        </div>
        <div className="page-inline-links">
          <Link className="page-chip-link" href="/regions">
            지역별 토익 시험장 보기
          </Link>
          {featuredRegions.slice(0, 4).map((region) => (
            <Link key={region} className="page-chip-link" href={`/regions/${region}`}>
              {region} 시험장
            </Link>
          ))}
        </div>
      </section>

      <section className="finder-section" id="finder-tool">
        <div className="finder-frame">
          <ToeicCenterFinderClient />
        </div>
      </section>
    </main>
  );
}
