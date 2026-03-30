import {
  TOEIC_CENTERS_ENDPOINT,
  TOEIC_SCHEDULE_ENDPOINT,
} from "@/lib/constants";
import { decodeHtmlEntities } from "@/lib/html-entities";
import type { ApiCenterInfo, ExamSchedule } from "@/lib/types";

let examSchedulesPromise: Promise<ExamSchedule[]> | null = null;
const centersPromiseCache = new Map<string, Promise<ApiCenterInfo[]>>();

const fetchJson = async <T>(input: RequestInfo | URL): Promise<T> => {
  const response = await fetch(input);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const fetchExamSchedules = async (): Promise<ExamSchedule[]> => {
  if (examSchedulesPromise) {
    return examSchedulesPromise;
  }

  examSchedulesPromise = fetchJson<ExamSchedule[]>(TOEIC_SCHEDULE_ENDPOINT)
    .then((rawSchedules) => {
      if (!Array.isArray(rawSchedules)) {
        throw new Error("시험 일정 정보 형식이 올바르지 않습니다.");
      }

      return rawSchedules.map((schedule) => ({
        exam_code: schedule.exam_code,
        exam_day: schedule.exam_day.split(" ")[0],
      }));
    })
    .catch((error) => {
      examSchedulesPromise = null;
      throw error;
    });

  return examSchedulesPromise;
};

export const fetchCenters = async (
  examCode: string,
  bigArea: string,
): Promise<ApiCenterInfo[]> => {
  const apiUrl = `${TOEIC_CENTERS_ENDPOINT}?examCode=${encodeURIComponent(
    examCode,
  )}&bigArea=${encodeURIComponent(bigArea)}`;

  const cachedCentersPromise = centersPromiseCache.get(apiUrl);

  if (cachedCentersPromise) {
    return cachedCentersPromise;
  }

  const centersPromise = fetchJson<unknown>(apiUrl)
    .then((data) => {
      if (!Array.isArray(data) || data.length < 3 || !Array.isArray(data[2])) {
        throw new Error("시험 센터 정보 형식이 올바르지 않습니다.");
      }

      return (data[2] as ApiCenterInfo[]).map((center) => ({
        ...center,
        center_name: decodeHtmlEntities(center.center_name),
        address: decodeHtmlEntities(center.address.trim()),
      }));
    })
    .catch((error) => {
      centersPromiseCache.delete(apiUrl);
      throw error;
    });

  centersPromiseCache.set(apiUrl, centersPromise);
  return centersPromise;
};
