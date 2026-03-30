import type { MetadataRoute } from "next";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getIndexedRegionDateLandings } from "@/lib/landing-data";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const CONTENT_UPDATED = new Date("2026-03-30");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const indexedLandings = await getIndexedRegionDateLandings();

  return [
    {
      url: siteUrl,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/regions`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...LOCATION_FILTERS.map((region) => ({
      url: `${siteUrl}/regions/${region}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...indexedLandings.map((entry) => ({
      url: `${siteUrl}/regions/${entry.region}/dates/${entry.examDate}`,
      lastModified: new Date(entry.examDate),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];
}
