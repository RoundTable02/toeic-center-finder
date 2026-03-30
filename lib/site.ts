import type { Metadata } from "next";
import { getConfiguredSiteUrl } from "@/lib/site-config";

const DEFAULT_SITE_NAME = "토익 시험장 찾기";
const DEFAULT_DESCRIPTION =
  "지역별 토익 시험장과 시험 일정을 한 번에 확인하고, 현재 위치 기준으로 가까운 시험장을 빠르게 찾을 수 있습니다.";
const DEFAULT_KEYWORDS = [
  "토익 시험장",
  "토익 고사장",
  "지역별 토익 시험장",
  "시험일별 토익 시험장",
  "토익 시험 일정",
  "토익 시험장 찾기",
];

export interface BreadcrumbStructuredDataItem {
  name: string;
  path: string;
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}

export const getSiteUrl = (): string => getConfiguredSiteUrl();

export const buildAbsoluteUrl = (path = "/"): string => {
  const siteUrl = getSiteUrl();
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
};

export const buildPageMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
}: PageMetadataOptions): Metadata => ({
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  keywords: [...DEFAULT_KEYWORDS, ...keywords],
  applicationName: DEFAULT_SITE_NAME,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: buildAbsoluteUrl(path),
    siteName: DEFAULT_SITE_NAME,
    locale: "ko_KR",
    images: [
      {
        url: "/img.png",
        width: 2942,
        height: 1548,
        alt: "토익 시험장 찾기 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/img.png"],
  },
  icons: {
    icon: "/location-map.png",
    apple: "/location-map.png",
  },
});

export const buildMetadata = (): Metadata =>
  ({
    ...buildPageMetadata({
      title: "내 근처 토익 시험장 찾기",
      description: DEFAULT_DESCRIPTION,
      path: "/",
      keywords: ["내 근처 토익", "TOEIC center"],
    }),
    verification: {
      other: {
        "naver-site-verification": "e3036bd7f9dd301fd4218e4b348b031efc9ead06",
      },
    },
  });

export const buildWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: DEFAULT_SITE_NAME,
  url: getSiteUrl(),
  description: DEFAULT_DESCRIPTION,
  inLanguage: "ko-KR",
});

export const buildBreadcrumbStructuredData = (
  items: BreadcrumbStructuredDataItem[],
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: buildAbsoluteUrl(item.path),
  })),
});

export const buildCollectionPageStructuredData = ({
  name,
  description,
  path,
  itemNames,
}: {
  name: string;
  description: string;
  path: string;
  itemNames: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: buildAbsoluteUrl(path),
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: itemNames.map((itemName, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: itemName,
    })),
  },
});

export const buildFaqStructuredData = (
  items: Array<{ question: string; answer: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});
