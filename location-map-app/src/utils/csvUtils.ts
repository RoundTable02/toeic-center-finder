/**
 * CSV 파일 경로에서 센터 좌표 데이터를 로드하여 Map으로 반환합니다.
 * @param csvFileName public 폴더 내의 CSV 파일 이름 (예: 'toeic_centers.csv')
 * @returns Promise<Map<string, { lat: number; lng: number }>> 센터 코드와 좌표 매핑 Map
 */
export const loadCenterCoordinatesFromCSV = async (csvFileName: string): Promise<Map<string, { lat: number; lng: number }>> => {
    const filePath = `${process.env.PUBLIC_URL}/${csvFileName}`;
    // console.log(`[CSV Parsing] Attempting to fetch CSV from: ${filePath}`); // 로그 제거
    try {
        const response = await fetch(filePath);
        // console.log(`[CSV Parsing] Fetch response status: ${response.status}`); // 로그 제거
        if (!response.ok) {
            if (response.status === 404) {
                 // 이 에러 로그는 파일 경로 문제 진단에 유용하므로 남겨두는 것을 고려할 수 있습니다.
                 console.error(`[CSV Parsing] File not found at ${filePath}. Make sure '${csvFileName}' is in the 'public' folder.`);
            }
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const csvText = await response.text();
        // console.log("[CSV Parsing] CSV text fetched (first 200 chars):", csvText.substring(0, 200)); // 로그 제거
        const lines = csvText.trim().split('\n');
        // console.log(`[CSV Parsing] Found ${lines.length} lines in CSV.`); // 로그 제거
        const coordinatesMap = new Map<string, { lat: number; lng: number }>();

        // 헤더 유무 확인 및 처리 (실제 CSV 파일에 맞게 조정된 상태여야 함)
        const dataLines = lines.slice(1); // 헤더가 있다고 가정
        // const dataLines = lines; // 헤더가 없는 경우

        // console.log(`[CSV Parsing] Processing ${dataLines.length} data lines.`); // 로그 제거

        dataLines.forEach((line, index) => {
            const parts = line.split(',');
            if (parts.length === 3) {
                const id = parts[0]?.trim();
                const latStr = parts[1]?.trim();
                const lngStr = parts[2]?.trim();

                if (id && latStr && lngStr) {
                    const lat = parseFloat(latStr);
                    const lng = parseFloat(lngStr);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        coordinatesMap.set(id, { lat, lng });
                    } else {
                         // console.warn(`[CSV Parsing] Invalid coordinate data...`); // 로그 제거
                    }
                } else {
                     // console.warn(`[CSV Parsing] Empty data found...`); // 로그 제거
                }
            } else {
                if(line.trim()) {
                    // console.warn(`[CSV Parsing] Skipping line...`); // 로그 제거
                }
            }
        });

        // console.log(`[CSV Parsing] Successfully loaded ${coordinatesMap.size} coordinates.`); // 로그 제거
        return coordinatesMap;
    } catch (error) {
        // 최종 에러 로그는 남겨두는 것이 일반적입니다.
        console.error('[CSV Parsing] Error loading or parsing CSV:', error);
        return new Map(); // 에러 시 빈 Map 반환
    }
}; 