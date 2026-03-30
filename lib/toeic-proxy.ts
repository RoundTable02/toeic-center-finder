import { DEFAULT_TOEIC_UPSTREAM_URL } from "@/lib/constants";

export class ToeicProxyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "ToeicProxyError";
  }
}

const TOEIC_REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Referer: "https://m.exam.toeic.co.kr",
  "Content-Type": "application/x-www-form-urlencoded",
};

type ToeicCacheEntry = {
  data: unknown | null;
  expiresAt: number;
};

const toeicResponseCache = new Map<string, ToeicCacheEntry>();

const buildCacheKey = (params: Record<string, string>): string =>
  new URLSearchParams(
    Object.entries(params).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  ).toString();

const getCachedResponse = (cacheKey: string): unknown | null | undefined => {
  const cachedEntry = toeicResponseCache.get(cacheKey);

  if (!cachedEntry) {
    return undefined;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    toeicResponseCache.delete(cacheKey);
    return undefined;
  }

  return cachedEntry.data;
};

const setCachedResponse = (
  cacheKey: string,
  ttlSeconds: number,
  data: unknown | null,
): void => {
  toeicResponseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

export const getToeicUpstreamUrl = (): string =>
  process.env.TOEIC_UPSTREAM_BASE_URL || DEFAULT_TOEIC_UPSTREAM_URL;

const getProxyTimeoutMs = (): number => {
  const timeout = Number(process.env.TOEIC_PROXY_TIMEOUT_MS ?? "15000");
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 15000;
};

export const postToToeicUpstream = async (
  params: Record<string, string>,
  options?: {
    cacheTtlSeconds?: number;
  },
): Promise<unknown | null> => {
  const cacheTtlSeconds = options?.cacheTtlSeconds ?? 0;
  const cacheKey = cacheTtlSeconds > 0 ? buildCacheKey(params) : null;

  if (cacheKey) {
    const cachedResponse = getCachedResponse(cacheKey);

    if (cachedResponse !== undefined) {
      return cachedResponse;
    }
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, getProxyTimeoutMs());

  try {
    const body = new URLSearchParams(params).toString();
    const response = await fetch(getToeicUpstreamUrl(), {
      method: "POST",
      headers: TOEIC_REQUEST_HEADERS,
      body,
      signal: abortController.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ToeicProxyError(
        `Upstream request failed with status ${response.status}`,
        `UPSTREAM_${response.status}`,
      );
    }

    const responseText = (await response.text()).trim();

    if (!responseText || responseText === "null") {
      if (cacheKey) {
        setCachedResponse(cacheKey, cacheTtlSeconds, null);
      }

      return null;
    }

    const parsedResponse = JSON.parse(responseText) as unknown;

    if (cacheKey) {
      setCachedResponse(cacheKey, cacheTtlSeconds, parsedResponse);
    }

    return parsedResponse;
  } catch (error) {
    if (error instanceof ToeicProxyError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ToeicProxyError("Upstream request timed out", "UPSTREAM_TIMEOUT");
    }

    const message = error instanceof Error ? error.message : "Unknown proxy error";
    throw new ToeicProxyError(message, "UPSTREAM_FETCH_FAILED");
  } finally {
    clearTimeout(timeoutId);
  }
};
