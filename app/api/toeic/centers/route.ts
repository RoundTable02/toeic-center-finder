import { NextRequest, NextResponse } from "next/server";
import {
  TOEIC_CENTERS_CACHE_TTL_SECONDS,
  TOEIC_CENTERS_STALE_TTL_SECONDS,
} from "@/lib/constants";
import { postToToeicUpstream, ToeicProxyError } from "@/lib/toeic-proxy";

export const runtime = "nodejs";

const CACHE_CONTROL = [
  "public",
  `max-age=${TOEIC_CENTERS_CACHE_TTL_SECONDS}`,
  `s-maxage=${TOEIC_CENTERS_CACHE_TTL_SECONDS}`,
  `stale-while-revalidate=${TOEIC_CENTERS_STALE_TTL_SECONDS}`,
].join(", ");

export async function GET(request: NextRequest) {
  const examCode = request.nextUrl.searchParams.get("examCode");
  const bigArea = request.nextUrl.searchParams.get("bigArea");

  if (!examCode || !bigArea) {
    return NextResponse.json(
      { error: "Missing required parameters: examCode or bigArea" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const data = await postToToeicUpstream({
      proc: "getExamAreaInfo",
      examCate: "TOE",
      examCode,
      bigArea,
      sbGoodsType1: "TOE",
    }, {
      cacheTtlSeconds: TOEIC_CENTERS_CACHE_TTL_SECONDS,
    });

    if (!data) {
      return NextResponse.json(
        { error: "No data received from TOEIC server" },
        {
          status: 404,
          headers: {
            "Cache-Control": CACHE_CONTROL,
          },
        },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    const proxyError =
      error instanceof ToeicProxyError
        ? error
        : new ToeicProxyError("Failed to fetch data", "UPSTREAM_FETCH_FAILED");

    return NextResponse.json(
      {
        error: "Failed to fetch data",
        message: proxyError.message,
        code: proxyError.code,
      },
      {
        status: proxyError.status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
