export const REQUIRED_SITE_URL = "https://toeic.roundtable02.com";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const normalizeSiteUrl = (value: string): string => {
  const normalized = trimTrailingSlash(value.trim());

  if (!/^https?:\/\//.test(normalized)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must start with http:// or https://. Received: ${value}`,
    );
  }

  return normalized;
};

export const getConfiguredSiteUrl = (): string =>
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || REQUIRED_SITE_URL);

export const assertProductionSiteUrl = (): void => {
  const shouldValidate =
    process.env.VERCEL_ENV === "production" || process.env.STRICT_SITE_URL_VALIDATION === "1";

  if (!shouldValidate) {
    return;
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!rawSiteUrl) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be set to ${REQUIRED_SITE_URL} for production builds.`,
    );
  }

  const siteUrl = normalizeSiteUrl(rawSiteUrl);

  if (siteUrl !== REQUIRED_SITE_URL) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be ${REQUIRED_SITE_URL}. Received: ${siteUrl}`,
    );
  }
};
