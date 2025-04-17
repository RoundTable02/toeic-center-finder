export interface Location {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  examType: string;
  examDate: string;
  location: string; // 지역 필터값 (bigArea)
  address: string;
  distance?: number; // 사용자 위치로부터의 직선 거리 (km)
}

export interface ExamSchedule {
  exam_code: string;
  exam_day: string; // "YYYY-MM-DD" 형식
}

// 외부 API에서 가져오는 센터 기본 정보 타입 (필요 시 구체화)
export interface ApiCenterInfo {
    center_code: string;
    center_name: string;
    address: string;
    // 외부 API 응답의 다른 필드들
} 