// import { toeicCenterCoordinates } from '../data/toeicCenterCoordinates'; // 제거
import {
    TOEIC_SCHEDULE_ENDPOINT,
    TOEIC_CENTERS_ENDPOINT,
} from '../constants';
import {
    ExamSchedule,
    ApiCenterInfo, // Location 대신 ApiCenterInfo 사용
} from '../types';
import { decodeHtmlEntities } from '../utils';

/**
 * 토익 시험 일정을 가져옵니다.
 * @returns Promise<ExamSchedule[]> 시험 일정 목록
 */
export const fetchExamSchedulesAPI = async (): Promise<ExamSchedule[]> => {
    const response = await fetch(TOEIC_SCHEDULE_ENDPOINT);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // API 응답 구조에 따라 적절히 파싱 (예시)
    if (!Array.isArray(data)) {
        console.error("Unexpected API response format for schedules:", data);
        throw new Error("시험 일정 정보 형식이 올바르지 않습니다.");
    }

    const schedules: ExamSchedule[] = data.map((item: any) => ({
        exam_code: item.exam_code,
        exam_day: item.exam_day.split(' ')[0] // "YYYY-MM-DD"
    }));
    return schedules;
};

/**
 * 특정 시험 코드와 지역에 해당하는 시험 센터 기본 정보를 가져옵니다.
 * (좌표 정보는 포함하지 않음)
 * @param examCode 시험 코드
 * @param bigArea 지역 필터 값
 * @returns Promise<ApiCenterInfo[]> 센터 기본 정보 배열
 */
export const fetchCentersAPI = async (examCode: string, bigArea: string): Promise<ApiCenterInfo[]> => {
    const apiUrl = `${TOEIC_CENTERS_ENDPOINT}?examCode=${examCode}&bigArea=${encodeURIComponent(bigArea)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data) || data.length < 3 || !Array.isArray(data[2])) {
        console.error('[fetchCentersAPI] Unexpected API response format:', data);
        throw new Error('시험 센터 정보 형식이 올바르지 않습니다.');
    }
    const centerDataFromAPI: ApiCenterInfo[] = data[2];

    // API에서 받은 데이터를 그대로 반환 (좌표 조회는 App.tsx에서 처리)
    // 필요 시 여기서 decodeHtmlEntities 적용 가능
    return centerDataFromAPI.map(center => ({
        ...center,
        center_name: decodeHtmlEntities(center.center_name),
        address: decodeHtmlEntities(center.address.trim()),
    }));
}; 