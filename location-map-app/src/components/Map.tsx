import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { MapContainerProps } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import L from 'leaflet';
import { Location } from '../types';
import { DEFAULT_MAP_ZOOM } from '../constants';

// Leaflet 기본 마커 아이콘
const defaultIcon = L.icon({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 선택된 마커 아이콘 (예: 녹색, 약간 크게)
const selectedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', // 녹색 아이콘 URL
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 49], // 기본보다 약간 크게
    iconAnchor: [15, 49], // 크기 변경에 따른 anchor 조정
    popupAnchor: [1, -40], // 크기 변경에 따른 popup anchor 조정
    shadowSize: [49, 49] // 그림자 크기도 조정
});

// 사용자 위치 마커 아이콘
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

// 지도 중심 이동 및 줌 레벨 유지를 위한 컴포넌트
const ChangeView: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  map.flyTo(center, map.getZoom());
  return null;
};

interface MapProps {
  locations: Location[];
  center: LatLngExpression;
  userLocation: { lat: number; lng: number } | null;
  selectedLocation: Location | null;
  onMarkerClick: (location: Location) => void;
}

const Map: React.FC<MapProps> = ({ locations, center, userLocation, selectedLocation, onMarkerClick }) => {

  const mapProps: MapContainerProps = {
    center: center,
    zoom: DEFAULT_MAP_ZOOM,
    style: { height: '100%', width: '100%' }
  };

  return (
    <MapWrapper>
      <MapContainer {...mapProps}>
        <ChangeView center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((location) => {
          const isSelected = selectedLocation !== null && selectedLocation.id === location.id;
          // 유효하지 않은 좌표 마커 생성 방지
          if (location.lat === 0 && location.lng === 0) {
              return null;
          }
          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={isSelected ? selectedIcon : defaultIcon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  onMarkerClick(location);
                },
              }}
            >
              <Popup>{location.name}</Popup>
            </Marker>
          );
        })}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>내 위치</Popup>
          </Marker>
        )}
      </MapContainer>
    </MapWrapper>
  );
};

export default Map; 