import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";
import StyledComponentsRegistry from "@/components/styled-components-registry";
import { buildMetadata, getSiteUrl } from "@/lib/site";

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "토익 시험장 찾기",
    url: getSiteUrl(),
    description: "내 주변 토익 시험장을 찾고 싶다면 지금 검색해보세요.",
    inLanguage: "ko-KR",
  };

  return (
    <html lang="ko">
      <body>
        <StyledComponentsRegistry>
          <h1 className="visually-hidden">내 주변 토익 시험장을 빠르게 찾는 방법</h1>
          <p className="visually-hidden">
            토익 시험장 위치를 지도에서 확인하고, 시험 일정도 함께 알아보세요.
          </p>
          {children}
        </StyledComponentsRegistry>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </body>
    </html>
  );
}
