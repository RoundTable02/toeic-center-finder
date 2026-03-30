import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { buildBreadcrumbStructuredData, buildFaqStructuredData, buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "토익 시험장 찾기 FAQ",
  description:
    "토익 시험장 검색 방법, 현재 위치 정렬, 시험일별 시험장 차이 등 자주 묻는 질문을 정리했습니다.",
  path: "/faq",
  keywords: ["토익 시험장 FAQ", "토익 시험장 찾기 방법"],
});

const FAQ_ITEMS = [
  {
    question: "토익 시험장은 지역별로 어떻게 찾나요?",
    answer:
      "홈 검색 도구에서 시험일과 지역을 선택하거나, 지역별 랜딩 페이지에서 원하는 지역을 먼저 선택하면 해당 지역의 시험일별 시험장 페이지로 이동할 수 있습니다.",
  },
  {
    question: "현재 위치로 가까운 시험장을 볼 수 있나요?",
    answer:
      "가능합니다. 검색 도구에서 현재 위치 사용 버튼을 누르면 브라우저 위치 정보를 바탕으로 시험장 목록이 가까운 순으로 다시 정렬됩니다.",
  },
  {
    question: "시험일마다 시험장이 달라지나요?",
    answer:
      "달라질 수 있습니다. 같은 지역이라도 시험일별로 공개되는 시험장 수와 목록이 달라질 수 있어, 날짜별 랜딩 페이지와 검색 도구를 함께 확인하는 것이 가장 정확합니다.",
  },
  {
    question: "시험장 주소도 확인할 수 있나요?",
    answer:
      "네. 지역·시험일 랜딩 페이지에는 대표 시험장명과 주소가 텍스트로 제공되며, 검색 도구에서는 전체 목록과 지도 위치를 함께 확인할 수 있습니다.",
  },
  {
    question: "토익 시험 접수 마감일은 언제까지인가요?",
    answer:
      "토익 정기시험 접수 마감은 보통 시험일 약 2~3주 전입니다. 정확한 마감일은 시험일마다 다르므로 ETS TOEIC Korea 공식 사이트(toeic.co.kr)에서 일정별 접수 기간을 확인하는 것이 가장 정확합니다.",
  },
  {
    question: "토익 시험 당일 필요한 준비물은 무엇인가요?",
    answer:
      "반드시 신분증(주민등록증, 운전면허증, 여권, 학생증 중 유효한 사진 부착 신분증)을 지참해야 합니다. 필기구는 시험장에서 제공하지 않으므로 연필과 지우개를 별도로 챙겨야 합니다. 입실 시간은 시험 시작 30분 전까지로 지각 시 입실이 불가합니다.",
  },
  {
    question: "토익 응시료는 얼마인가요?",
    answer:
      "정기시험 응시료는 약 52,000원 수준이며, 추가 접수(특별 접수) 시에는 별도 수수료가 붙을 수 있습니다. 정확한 금액은 ETS TOEIC Korea 공식 사이트에서 확인하세요.",
  },
  {
    question: "토익 성적은 시험 후 얼마나 걸려야 확인할 수 있나요?",
    answer:
      "시험일로부터 약 10일(영업일 기준) 후 온라인으로 성적이 발표됩니다. 성적표 수령은 온라인 출력 또는 우편 발송 중 선택할 수 있으며, 성적의 유효기간은 발표일로부터 2년입니다.",
  },
  {
    question: "토익 시험장을 변경할 수 있나요?",
    answer:
      "접수 기간 중에는 ETS TOEIC Korea 사이트에서 시험장 변경이 가능합니다. 접수 마감 이후에는 변경이 불가하며, 취소 후 재접수 시 자리가 마감되어 있을 수 있으니 가급적 접수 기간 내에 확인하는 것이 좋습니다.",
  },
];

export default function FaqPage() {
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "FAQ" },
  ];

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <JsonLd data={buildFaqStructuredData(FAQ_ITEMS)} />

      <section className="page-hero">
        <p className="page-kicker">답변형 콘텐츠</p>
        <h1>토익 시험장 찾기 FAQ</h1>
        <p className="page-lead">
          토익 시험장 검색에서 자주 나오는 질문만 모아 간단하고 직접적인 답변으로
          정리했습니다. 자주 나오는 질문만 간결한 답변으로 정리했습니다.
        </p>
      </section>

      <section className="page-section">
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <article className="faq-item" key={item.question}>
              <h2>{item.question}</h2>
              <p className="page-copy">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
