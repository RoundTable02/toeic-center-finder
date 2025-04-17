/**
 * HTML 엔티티 코드를 디코딩합니다.
 * 클라이언트 사이드에서만 작동합니다.
 */
export const decodeHtmlEntities = (text: string): string => {
  if (typeof window !== 'undefined') {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }
  return text; // 서버 사이드 등 window 객체가 없을 경우 원본 반환
};

/**
 * 두 지점 간의 Haversine 거리를 계산합니다 (단위: km).
 */
export const calculateHaversineDistance = (
  lat1: number, lon1: number, lat2: number, lon2: number
): number => {
  if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) {
      return Infinity; // 유효하지 않은 좌표는 무한대로 처리
  }
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * 거리를 m 또는 km 단위 문자열로 포맷합니다.
 */
export const formatDistance = (distance?: number): string => {
    if (distance === undefined || distance === Infinity) return '-'; // 계산 불가 또는 무한대
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
};

export { loadCenterCoordinatesFromCSV } from './csvUtils';