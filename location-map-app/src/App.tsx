import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import LocationList from './components/LocationList';
import Map from './components/Map';
import { fetchExamSchedulesAPI, fetchCentersAPI } from './api/toeicAPI';
import { Location, ExamSchedule, ApiCenterInfo } from './types';
import { EXAM_TYPES, LOCATION_FILTERS, DEFAULT_MAP_CENTER } from './constants';
import { calculateHaversineDistance, loadCenterCoordinatesFromCSV } from './utils';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const ListContainer = styled.div`
  width: 300px;
  padding: 20px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
    
    &:hover {
      background: #555;
    }
  }
`;

const MapContainer = styled.div`
  flex: 1;
  height: 100%;
`;

const App: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [examDates, setExamDates] = useState<string[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>(EXAM_TYPES[0]);
  const [selectedExamDate, setSelectedExamDate] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Location[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [centerCoordinates, setCenterCoordinates] = useState<Map<string, { lat: number; lng: number }> | null>(null);

  const allFiltersSelected = selectedExamType !== '' &&
                           selectedExamDate !== '' &&
                           selectedLocationFilter !== '';

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (location.lat !== 0 && location.lng !== 0) {
      setMapCenter([location.lat, location.lng]);
    } else {
      // console.warn(`Location ${location.name} has no coordinates.`); // 로그 제거 (필요 시 유지)
    }
  };

  const handleUserLocationChange = (location: { lat: number; lng: number } | null) => {
    setUserLocation(location);
    if (location) {
        setMapCenter([location.lat, location.lng]);
    } else {
        setMapCenter(DEFAULT_MAP_CENTER);
        setSortedLocations([]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoadingData(true);
        try {
            const coords = await loadCenterCoordinatesFromCSV('toeic_centers.csv');
            setCenterCoordinates(coords);
        } catch (error) {
            console.error("Failed to load center coordinates:", error); // 에러 로그는 유지
            setError("시험장 좌표 데이터를 불러오는데 실패했습니다.");
        } finally {
            setIsLoadingData(false);
        }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (selectedExamType === '토익') {
        setIsLoadingSchedules(true);
        setError(null);
        try {
          const schedules = await fetchExamSchedulesAPI();
          setExamSchedules(schedules);
          const uniqueDates = Array.from(new Set(schedules.map((s: ExamSchedule) => s.exam_day))).sort() as string[];
          setExamDates(uniqueDates);
        } catch (err) {
          console.error('시험 일정을 가져오는 중 오류 발생:', err); // 에러 로그는 유지
          setError('시험 일정을 불러오는 데 실패했습니다.');
          setExamSchedules([]);
          setExamDates([]);
        } finally {
          setIsLoadingSchedules(false);
        }
      } else {
        setExamSchedules([]);
        setExamDates([]);
      }
    };
    loadSchedules();
  }, [selectedExamType]);

  useEffect(() => {
    const loadCenters = async () => {
      if (!allFiltersSelected || centerCoordinates === null) {
        setLocations([]);
        return;
      }

      const selectedSchedule = examSchedules.find(schedule => schedule.exam_day === selectedExamDate);
      if (!selectedSchedule) {
        setError('선택된 날짜의 시험 정보를 찾을 수 없습니다.');
        setLocations([]);
        return;
      }

      setIsLoadingCenters(true);
      setError(null);
      setLocations([]);

      try {
        const fetchedCentersInfo: ApiCenterInfo[] = await fetchCentersAPI(selectedSchedule.exam_code, selectedLocationFilter);

        const centersWithCoords: Omit<Location, 'distance'>[] = fetchedCentersInfo
            .map((centerInfo): Omit<Location, 'distance'> | null => {
                const centerCode = centerInfo.center_code;
                if (!centerCode) return null;

                const coordinates = centerCoordinates.get(centerCode);
                const lat = coordinates?.lat ?? 0;
                const lng = coordinates?.lng ?? 0;

                if (lat === 0 && lng === 0 && coordinates === undefined) {
                    // console.warn(`[App - loadCenters] Coordinates not found...`); // 로그 제거 (필요 시 유지)
                }

                return {
                    id: centerCode,
                    name: centerInfo.center_name,
                    address: centerInfo.address,
                    lat: lat,
                    lng: lng,
                    examType: selectedExamType,
                    examDate: selectedExamDate,
                    location: selectedLocationFilter,
                };
            })
            .filter((loc): loc is Omit<Location, 'distance'> => loc !== null);

        const finalLocations: Location[] = centersWithCoords.map(center => ({
            ...center,
            examType: selectedExamType,
            examDate: selectedExamDate,
            location: selectedLocationFilter,
        }));

        setLocations(finalLocations);

      } catch (err) {
        console.error('시험 센터 정보를 가져오는 중 오류 발생:', err); // 에러 로그는 유지
        setError('시험 센터 정보를 불러오는 데 실패했습니다.');
        setLocations([]);
      } finally {
        setIsLoadingCenters(false);
      }
    };

    if ((examSchedules.length > 0 || !isLoadingSchedules) && !isLoadingData) {
        loadCenters();
    }

    setSelectedLocation(null);
    setSortedLocations([]);

  }, [selectedExamDate, selectedLocationFilter, examSchedules, allFiltersSelected, selectedExamType, isLoadingSchedules, centerCoordinates, isLoadingData]);

  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const locationsWithDistance = locations.map(loc => ({
        ...loc,
        distance: calculateHaversineDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
      }));

      locationsWithDistance.sort((a, b) => {
        if (a.distance === Infinity && b.distance === Infinity) return 0;
        if (a.distance === Infinity) return 1;
        if (b.distance === Infinity) return -1;
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      setSortedLocations(locationsWithDistance);
    } else {
      if (!userLocation) {
          setSortedLocations([]);
      }
    }
  }, [userLocation, locations]);

  const displayLocations = allFiltersSelected ? (userLocation ? sortedLocations : locations) : [];
  const isLoading = isLoadingData || isLoadingSchedules || isLoadingCenters;

  const ErrorDisplay = error ? <div style={{ color: 'red', padding: '10px' }}>{error}</div> : null;

  return (
    <AppContainer>
      <ListContainer>
        {ErrorDisplay}
        <ScrollableContent>
          <LocationList
            locations={displayLocations}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            examTypes={EXAM_TYPES}
            examDates={examDates}
            locationFilters={LOCATION_FILTERS}
            selectedExamType={selectedExamType}
            selectedExamDate={selectedExamDate}
            selectedLocationFilter={selectedLocationFilter}
            onExamTypeChange={(type) => {
              setSelectedExamType(type);
              setSelectedExamDate('');
              setSelectedLocationFilter('');
              setLocations([]);
            }}
            onExamDateChange={(date) => {
              setSelectedExamDate(date);
              setSelectedLocationFilter('');
            }}
            onLocationFilterChange={(locFilter) => {
              setSelectedLocationFilter(locFilter);
            }}
            onUserLocationChange={handleUserLocationChange}
            allFiltersSelected={allFiltersSelected}
            isLocationLoading={isLoading}
          />
        </ScrollableContent>
      </ListContainer>
      <MapContainer>
        <Map
          locations={displayLocations}
          center={mapCenter}
          userLocation={userLocation}
          selectedLocation={selectedLocation}
          onMarkerClick={handleLocationSelect}
        />
      </MapContainer>
    </AppContainer>
  );
};

export default App;
