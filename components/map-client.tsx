"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import styled from "styled-components";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { DEFAULT_MAP_ZOOM } from "@/lib/constants";
import type { Location } from "@/lib/types";

const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const svgMarker = (fillColor: string, scale = 1): string => {
  const width = 30 * scale;
  const height = 42 * scale;
  const circleRadius = 7 * scale;
  const stemX = width / 2;
  const stemY = 14 * scale;
  const circleY = 11 * scale;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M${stemX} ${height}C${stemX} ${height} ${3 * scale} ${24 * scale} ${3 * scale} ${13 * scale}C${3 * scale} ${6 * scale} ${9 * scale} 0 ${stemX} 0C${width - 9 * scale} 0 ${width - 3 * scale} ${6 * scale} ${width - 3 * scale} ${13 * scale}C${width - 3 * scale} ${24 * scale} ${stemX} ${height} ${stemX} ${height}Z" fill="${fillColor}" stroke="#1f2937" stroke-width="${1.5 * scale}" />
      <circle cx="${stemX}" cy="${circleY}" r="${circleRadius}" fill="white" />
      <circle cx="${stemX}" cy="${circleY}" r="${circleRadius / 2}" fill="${fillColor}" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const selectedIcon = L.icon({
  iconUrl: svgMarker("#16a34a", 1.1),
  iconSize: [33, 46],
  iconAnchor: [16, 46],
  popupAnchor: [0, -34],
});

const userIcon = L.icon({
  iconUrl: svgMarker("#f97316", 1),
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -34],
});

function ChangeView({ center }: { center: LatLngExpression }) {
  const map = useMap();
  map.flyTo(center, map.getZoom(), {
    duration: 0.5,
  });
  return null;
}

interface MapClientProps {
  locations: Location[];
  center: LatLngExpression;
  userLocation: { lat: number; lng: number } | null;
  selectedLocation: Location | null;
  onMarkerClick: (location: Location) => void;
}

export default function MapClient({
  locations,
  center,
  userLocation,
  selectedLocation,
  onMarkerClick,
}: MapClientProps) {
  return (
    <MapWrapper data-testid="leaflet-map">
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <ChangeView center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {locations.map((location) => {
          if (location.lat === 0 && location.lng === 0) {
            return null;
          }

          const isSelected =
            selectedLocation !== null && selectedLocation.id === location.id;

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={isSelected ? selectedIcon : defaultIcon}
              zIndexOffset={isSelected ? 1000 : 0}
              title={location.name}
              alt={location.name}
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

        {userLocation ? (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            title="내 위치"
            alt="내 위치"
          >
            <Popup>내 위치</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </MapWrapper>
  );
}
