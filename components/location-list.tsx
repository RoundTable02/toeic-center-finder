"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { formatDistance } from "@/lib/distance";
import type { Location } from "@/lib/types";

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItemButton = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  padding: 12px;
  border: 0;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  text-align: left;
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#e0e0e0" : "transparent"};

  &:hover {
    background-color: #e0e0e0;
  }
`;

const LocationName = styled.div`
  font-weight: 700;
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
  font-weight: 700;
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

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  border: 4px solid rgb(0 0 0 / 10%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  margin: 20px auto;
  animation: ${spin} 1s linear infinite;
`;

const HelperText = styled.p`
  margin: 0 0 12px;
  color: #4b5563;
  font-size: 0.92rem;
`;

interface LocationListProps {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  examTypes: readonly string[];
  examDates: string[];
  locationFilters: readonly string[];
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

export default function LocationList({
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
  isLocationLoading,
}: LocationListProps) {
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError("브라우저에서 위치 정보 기능을 지원하지 않습니다.");
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
        maximumAge: 60000,
      },
    );
  };

  return (
    <>
      <GeolocationButton
        onClick={handleGetCurrentLocation}
        disabled={isGeolocationLoading}
        type="button"
      >
        {isGeolocationLoading ? "위치 찾는 중..." : "현재 위치 사용"}
      </GeolocationButton>

      {geolocationError ? (
        <HelperText role="alert" data-testid="geolocation-error">
          {geolocationError}
        </HelperText>
      ) : null}

      <DropdownContainer>
        <DropdownLabel htmlFor="exam-type-select">시험 종류</DropdownLabel>
        <Dropdown
          id="exam-type-select"
          value={selectedExamType}
          onChange={(event) => onExamTypeChange(event.target.value)}
        >
          <option value="">선택하세요</option>
          {examTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Dropdown>
      </DropdownContainer>

      <DropdownContainer>
        <DropdownLabel htmlFor="exam-date-select">시험 일정</DropdownLabel>
        <Dropdown
          id="exam-date-select"
          value={selectedExamDate}
          onChange={(event) => onExamDateChange(event.target.value)}
          disabled={!selectedExamType || isLocationLoading}
        >
          <option value="">선택하세요</option>
          {examDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </Dropdown>
      </DropdownContainer>

      <DropdownContainer>
        <DropdownLabel htmlFor="location-filter-select">위치</DropdownLabel>
        <Dropdown
          id="location-filter-select"
          value={selectedLocationFilter}
          onChange={(event) => onLocationFilterChange(event.target.value)}
          disabled={!selectedExamDate || isLocationLoading}
        >
          <option value="">선택하세요</option>
          {locationFilters.map((locationFilter) => (
            <option key={locationFilter} value={locationFilter}>
              {locationFilter}
            </option>
          ))}
        </Dropdown>
      </DropdownContainer>

      {isLocationLoading ? (
        <Spinner aria-label="로딩 중" />
      ) : locations.length > 0 && allFiltersSelected ? (
        <List aria-label="시험장 목록">
          {locations.map((location) => {
            const isSelected =
              selectedLocation !== null && selectedLocation.id === location.id;

            return (
              <li key={location.id}>
                <ListItemButton
                  type="button"
                  $isSelected={isSelected}
                  aria-pressed={isSelected}
                  data-testid={`location-item-${location.id}`}
                  onClick={() => onLocationSelect(location)}
                >
                  <LocationName>{location.name}</LocationName>
                  <LocationAddress>{location.address}</LocationAddress>
                  {location.distance !== undefined &&
                  location.distance !== Number.POSITIVE_INFINITY ? (
                    <LocationDistance>
                      직선 거리: {formatDistance(location.distance)}
                    </LocationDistance>
                  ) : null}
                </ListItemButton>
              </li>
            );
          })}
        </List>
      ) : (
        <HelperText>
          {allFiltersSelected
            ? "선택한 조건에 맞는 시험장이 없습니다."
            : "시험 일정과 지역을 선택하면 시험장 목록이 표시됩니다."}
        </HelperText>
      )}
    </>
  );
}
