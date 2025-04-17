import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Location } from '../types';
import { formatDistance } from '../utils';

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li<{ isSelected: boolean }>`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  background-color: ${props => props.isSelected ? '#e0e0e0' : 'transparent'};
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const LocationName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
`;

const LocationAddress = styled.div`
  font-size: 0.9em;
  color: #666;
  margin-bottom: 4px;
`;

const LocationDistance = styled.div`
  font-size: 0.85em;
  color: #007bff;
  margin-top: 4px;
`;

const DropdownContainer = styled.div`
  margin-bottom: 20px;
`;

const DropdownLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Dropdown = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  margin-bottom: 10px;
`;

const GeolocationButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;

  &:hover {
    background-color: #218838;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

// 스피너 애니메이션 정의
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 스피너 스타일 정의
const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  margin: 20px auto;

  animation: ${spin} 1s linear infinite;
`;

interface LocationListProps {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  examTypes: string[];
  examDates: string[];
  locationFilters: string[];
  selectedExamType: string;
  selectedExamDate: string;
  selectedLocationFilter: string;
  onExamTypeChange: (value: string) => void;
  onExamDateChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onUserLocationChange: (location: { lat: number; lng: number } | null) => void;
  allFiltersSelected: boolean;
  isLocationLoading: boolean;
}

const LocationList: React.FC<LocationListProps> = ({ 
  locations, 
  selectedLocation, 
  onLocationSelect,
  examTypes,
  examDates,
  locationFilters,
  selectedExamType,
  selectedExamDate,
  selectedLocationFilter,
  onExamTypeChange,
  onExamDateChange,
  onLocationFilterChange,
  onUserLocationChange,
  allFiltersSelected,
  isLocationLoading
}) => {
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError('브라우저에서 위치 정보 기능을 지원하지 않습니다.');
      return;
    }

    setIsGeolocationLoading(true);
    setGeolocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUserLocationChange({ lat: latitude, lng: longitude });
        setIsGeolocationLoading(false);
      },
      (error) => {
        let message = `위치 정보를 가져오는 데 실패했습니다. (코드: ${error.code})`;
        if (error.message) {
            message += `: ${error.message}`;
        }
        setGeolocationError(message);
        onUserLocationChange(null);
        setIsGeolocationLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  return (
    <>
      <GeolocationButton onClick={handleGetCurrentLocation} disabled={isGeolocationLoading}>
        {isGeolocationLoading ? '위치 찾는 중...' : '현재 위치 사용'}
      </GeolocationButton>
      {geolocationError && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9em' }}>{geolocationError}</div>}

      <DropdownContainer>
        <DropdownLabel>시험 종류</DropdownLabel>
        <Dropdown 
          value={selectedExamType}
          onChange={(e) => onExamTypeChange(e.target.value)}
        >
          <option value="">선택하세요</option>
          {examTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Dropdown>
      </DropdownContainer>

      <DropdownContainer>
        <DropdownLabel>시험 일정</DropdownLabel>
        <Dropdown 
          value={selectedExamDate}
          onChange={(e) => onExamDateChange(e.target.value)}
          disabled={!selectedExamType || isLocationLoading}
        >
          <option value="">선택하세요</option>
          {examDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </Dropdown>
      </DropdownContainer>

      <DropdownContainer>
        <DropdownLabel>위치</DropdownLabel>
        <Dropdown 
          value={selectedLocationFilter}
          onChange={(e) => onLocationFilterChange(e.target.value)}
          disabled={!selectedExamDate || isLocationLoading}
        >
          <option value="">선택하세요</option>
          {locationFilters.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </Dropdown>
      </DropdownContainer>

      {isLocationLoading ? (
        <Spinner />
      ) : (
        locations.length > 0 && allFiltersSelected ? (
          <List>
            {locations.map((location) => (
              <ListItem 
                key={location.id}
                isSelected={selectedLocation !== null && selectedLocation.id === location.id}
                onClick={() => onLocationSelect(location)}
              >
                <LocationName>{location.name}</LocationName>
                <LocationAddress>
                  {location.address}
                </LocationAddress>
                {location.distance !== undefined && location.distance !== Infinity && (
                  <LocationDistance>
                    직선 거리: {formatDistance(location.distance)}
                  </LocationDistance>
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          allFiltersSelected && <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>해당 조건의 시험 장소가 없습니다.</div>
        )
      )}
    </>
  );
};

export default LocationList; 