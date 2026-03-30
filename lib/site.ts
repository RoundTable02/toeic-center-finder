import type { Metadata } from "next";
import { DEFAULT_SITE_URL } from "@/lib/constants";

export const getSiteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const buildMetadata = (): Metadata => {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: "내 근처 토익 시험장 찾기",
    description:
      "내 근처 토익 시험장 찾기, 토익 시험 일정 확인 및 지도 검색 서비스입니다.",
    keywords: [
      "토익",
      "토익 시험장",
      "내 근처 토익",
      "영어 시험",
      "TOEIC center",
      "고사장",
      "토익 고사장",
      "시험장 찾기",
    ],
    applicationName: "내 근처 토익 시험장 찾기",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "토익 시험장 찾기",
      description: "전국 토익 시험장을 한눈에, 내 주변에서 가까운 곳을 찾아보세요.",
      type: "website",
      url: siteUrl,
      images: [
        {
          url: "/img.png",
          width: 2942,
          height: 1548,
          alt: "토익 시험장 찾기 미리보기",
        },
      ],
    },
    icons: {
      icon: "/location-map.png",
      apple: "/location-map.png",
    },
  };
};
