import type { Coordinates } from "@/lib/types";

let centerCoordinatesPromise: Promise<Map<string, Coordinates>> | null = null;

const parseCenterCoordinateLine = (line: string): [string, Coordinates] | null => {
  const parts = line.split(",").map((part) => part.trim());

  if (parts.length < 3) {
    return null;
  }

  const [centerCode, latitudeText, longitudeText] = parts;
  const lat = Number.parseFloat(latitudeText);
  const lng = Number.parseFloat(longitudeText);

  if (!centerCode || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [centerCode, { lat, lng }];
};

export const parseCenterCoordinatesCsv = (
  csvText: string,
): Map<string, Coordinates> => {
  const normalizedCsv = csvText.replace(/^\uFEFF/, "");
  const lines = normalizedCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const coordinateMap = new Map<string, Coordinates>();

  for (const line of lines) {
    const parsedLine = parseCenterCoordinateLine(line);

    if (!parsedLine) {
      continue;
    }

    const [centerCode, coordinates] = parsedLine;
    coordinateMap.set(centerCode, coordinates);
  }

  return coordinateMap;
};

export const loadCenterCoordinates = async (
  csvPath = "/toeic_centers.csv",
): Promise<Map<string, Coordinates>> => {
  if (centerCoordinatesPromise) {
    return centerCoordinatesPromise;
  }

  centerCoordinatesPromise = fetch(csvPath)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch center coordinates: ${response.status}`);
      }

      const csvText = await response.text();
      return parseCenterCoordinatesCsv(csvText);
    })
    .catch((error) => {
      centerCoordinatesPromise = null;
      throw error;
    });

  return centerCoordinatesPromise;
};
