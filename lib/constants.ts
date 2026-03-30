import { REQUIRED_SITE_URL } from "@/lib/site-config";

export const EXAM_TYPES = ["토익"];

export const LOCATION_FILTERS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "세종",
  "광주",
  "경남",
  "경북",
  "울산",
  "전남",
  "전북",
  "충청",
  "강원",
  "제주",
] as const;

export const DEFAULT_MAP_CENTER: [number, number] = [37.5665, 126.978];
export const DEFAULT_MAP_ZOOM = 13;

export const API_BASE_URL = "/api";
export const TOEIC_SCHEDULE_ENDPOINT = `${API_BASE_URL}/toeic`;
export const TOEIC_CENTERS_ENDPOINT = `${API_BASE_URL}/toeic/centers`;

export const DEFAULT_SITE_URL = REQUIRED_SITE_URL;
export const DEFAULT_TOEIC_UPSTREAM_URL =
  "https://m.exam.toeic.co.kr/receipt/centerMapProc.php";

export const ONE_HOUR_IN_SECONDS = 60 * 60;
export const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;

export const TOEIC_SCHEDULE_CACHE_TTL_SECONDS = ONE_HOUR_IN_SECONDS;
export const TOEIC_SCHEDULE_STALE_TTL_SECONDS = ONE_DAY_IN_SECONDS;
export const TOEIC_CENTERS_CACHE_TTL_SECONDS = ONE_DAY_IN_SECONDS;
export const TOEIC_CENTERS_STALE_TTL_SECONDS = ONE_DAY_IN_SECONDS * 7;
