import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <main>
      <h1 className="visually-hidden">내 근처 토익 시험장 찾기</h1>
      <p className="visually-hidden">
        지역별 토익 시험장과 시험 일정을 확인하고, 현재 위치 기준으로 가까운
        시험장을 찾을 수 있습니다.
      </p>
      <ToeicCenterFinderClient />
    </main>
  );
}
