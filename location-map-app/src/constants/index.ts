export const EXAM_TYPES = ['토익']; // 현재는 토익만 지원

// 지역 필터 옵션
export const LOCATION_FILTERS = ["서울", "경기", "인천", "부산", "대구", "대전", "세종", "광주", "경남", "경북", "울산", "전남", "전북", "충청", "강원", "제주"];

// 지도 기본 설정
export const DEFAULT_MAP_CENTER: [number, number] = [37.5665, 126.9780]; // 서울 시청
export const DEFAULT_MAP_ZOOM = 13;

// API 엔드포인트 (선택 사항: 더 깔끔하게 관리)
// export const API_BASE_URL = 'https://api-h6nav77v5q-uc.a.run.app';
export const API_BASE_URL = './api';
export const TOEIC_SCHEDULE_ENDPOINT = `${API_BASE_URL}/toeic`;
export const TOEIC_CENTERS_ENDPOINT = `${API_BASE_URL}/toeic/centers`;
