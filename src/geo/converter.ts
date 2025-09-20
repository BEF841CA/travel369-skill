interface CityInfo {
  cityId: string;
  cityPoint: [number, number];
}

const CITIES_INFO: Record<string, CityInfo> = {
  '2500': { cityId: '2500', cityPoint: [116, 36] },
  '2534': { cityId: '2534', cityPoint: [117, 37] },
  '2342': { cityId: '2342', cityPoint: [117, 34] },
  '3511': { cityId: '3511', cityPoint: [118, 26] },
};

const DEFAULT_CITY = '2500';
let currentCity: CityInfo = CITIES_INFO[DEFAULT_CITY];

export function setCity(cityId: string): void {
  if (CITIES_INFO[cityId]) {
    currentCity = CITIES_INFO[cityId];
  }
}

export interface GeoPoint {
  type: number;
  lng: number;
  lat: number;
  velocity: number;
}

const DICTIONARY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_+=,.<>!@#$%^&*()/?;`~:';

function decodeGeo87(geo: string): number {
  let result = 0n;
  for (let j = 0; j < 7; j++) {
    const tmp = DICTIONARY.indexOf(geo[j]);
    if (tmp >= 0) {
      result = result * 87n + BigInt(tmp);
    } else {
      throw new Error('Invalid geo code');
    }
  }
  
  const bin87 = result.toString(2).padStart(45, '0');
  const type = parseInt(bin87.substr(0, 2), 2);
  let lng: number;
  let lat: number;
  let velocity = 0;

  if (type < 3) {
    const lngSign = bin87.substr(2, 1) === '1' ? -1 : 1;
    const latSign = bin87.substr(24, 1) === '1' ? -1 : 1;
    
    lng = parseInt(bin87.substr(3, 21), 2) / (lngSign * 1000000) + currentCity.cityPoint[0];
    lat = parseInt(bin87.substr(25, 20), 2) / (latSign * 500000) + currentCity.cityPoint[1];
  } else {
    const lngSign = bin87.substr(5, 1) === '1' ? -1 : 1;
    const latSign = bin87.substr(25, 1) === '1' ? -1 : 1;
    
    lng = parseInt(bin87.substr(6, 19), 2) / (lngSign * 1000000);
    lat = parseInt(bin87.substr(26, 19), 2) / (latSign * 1000000);
    velocity = parseInt(bin87.substr(2, 3), 2);
  }

  return type;
}

export function convertGeoToPoint(geo: string, last?: GeoPoint): GeoPoint {
  if (geo.length !== 7) {
    throw new Error('Invalid geo code length');
  }

  let result = 0n;
  for (let j = 0; j < 7; j++) {
    const tmp = DICTIONARY.indexOf(geo[j]);
    if (tmp >= 0) {
      result = result * 87n + BigInt(tmp);
    } else {
      throw new Error('Invalid geo code character');
    }
  }

  const bin87 = result.toString(2).padStart(45, '0');
  const type = parseInt(bin87.substr(0, 2), 2);
  let lng: number;
  let lat: number;
  let velocity = 0;

  if (type < 3) {
    const lngSign = bin87.substr(2, 1) === '1' ? -1 : 1;
    const latSign = bin87.substr(24, 1) === '1' ? -1 : 1;
    
    lng = parseInt(bin87.substr(3, 21), 2) / (lngSign * 1000000) + currentCity.cityPoint[0];
    lat = parseInt(bin87.substr(25, 20), 2) / (latSign * 500000) + currentCity.cityPoint[1];
  } else {
    const lngSign = bin87.substr(5, 1) === '1' ? -1 : 1;
    const latSign = bin87.substr(25, 1) === '1' ? -1 : 1;
    
    lng = parseInt(bin87.substr(6, 19), 2) / (lngSign * 1000000) + (last?.lng || 0);
    lat = parseInt(bin87.substr(26, 19), 2) / (latSign * 1000000) + (last?.lat || 0);
    velocity = parseInt(bin87.substr(2, 3), 2);
  }

  return {
    type: type < 3 ? type : last?.type || 0,
    lng,
    lat,
    velocity,
  };
}

export function convertGeoToPoints(geo: string): GeoPoint[] {
  if (geo.length % 7 !== 0) {
    throw new Error('Invalid geo string length');
  }

  const points: GeoPoint[] = [];
  let last: GeoPoint | undefined;

  for (let i = 0; i < geo.length; i += 7) {
    const point = convertGeoToPoint(geo.substr(i, 7), last);
    points.push(point);
    last = point;
  }

  return points;
}

function bd09togcj02(point: [number, number]): [number, number] {
  const x_pi = (3.14159265358979324 * 3000.0) / 180.0;
  const x = point[0] - 0.0065;
  const y = point[1] - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  const gg_lng = z * Math.cos(theta);
  const gg_lat = z * Math.sin(theta);
  return [gg_lng, gg_lat];
}

function gcj02tobd09(point: [number, number]): [number, number] {
  const x_pi = (3.14159265358979324 * 3000.0) / 180.0;
  const z = Math.sqrt(point[0] * point[0] + point[1] * point[1]) + 0.00002 * Math.sin(point[1] * x_pi);
  const theta = Math.atan2(point[1], point[0]) + 0.000003 * Math.cos(point[0] * x_pi);
  const bd_lng = z * Math.cos(theta) + 0.0065;
  const bd_lat = z * Math.sin(theta) + 0.006;
  return [bd_lng, bd_lat];
}

function transformlat(point: [number, number]): number {
  let ret =
    -100.0 +
    2.0 * point[0] +
    3.0 * point[1] +
    0.2 * point[1] * point[1] +
    0.1 * point[0] * point[1] +
    0.2 * Math.sqrt(Math.abs(point[0]));
  ret +=
    ((20.0 * Math.sin(6.0 * point[0] * Math.PI) + 20.0 * Math.sin(2.0 * point[0] * Math.PI)) * 2.0) / 3.0;
  ret +=
    ((20.0 * Math.sin(point[1] * Math.PI) + 40.0 * Math.sin((point[1] / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret +=
    ((160.0 * Math.sin((point[1] / 12.0) * Math.PI) + 320 * Math.sin((point[1] * Math.PI) / 30.0)) * 2.0) /
    3.0;
  return ret;
}

function transformlng(point: [number, number]): number {
  let ret =
    300.0 +
    point[0] +
    2.0 * point[1] +
    0.1 * point[0] * point[0] +
    0.1 * point[0] * point[1] +
    0.1 * Math.sqrt(Math.abs(point[0]));
  ret +=
    ((20.0 * Math.sin(6.0 * point[0] * Math.PI) + 20.0 * Math.sin(2.0 * point[0] * Math.PI)) * 2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(point[0] * Math.PI) + 40.0 * Math.sin((point[0] / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret +=
    ((150.0 * Math.sin((point[0] / 12.0) * Math.PI) + 300.0 * Math.sin((point[0] / 30.0) * Math.PI)) * 2.0) /
    3.0;
  return ret;
}

function out_of_china(point: [number, number]): boolean {
  return (
    point[0] < 72.004 ||
    point[0] > 137.8347 ||
    point[1] < 0.8293 ||
    point[1] > 55.8271
  );
}

function wgs84togcj02(point: [number, number]): [number, number] {
  if (out_of_china(point)) {
    return point;
  }

  const dlat = transformlat([point[0] - 105.0, point[1] - 35.0]);
  const dlng = transformlng([point[0] - 105.0, point[1] - 35.0]);
  const radlat = (point[1] / 180.0) * Math.PI;
  const magic = Math.sin(radlat);
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  
  const sqrtmagic = Math.sqrt(1 - ee * magic * magic);
  const mglat =
    (dlat * 180.0) / ((a * (1 - ee)) / (sqrtmagic * magic * magic) * Math.PI);
  const mglng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI);
  
  return [point[0] + mglng, point[1] + mglat];
}

function gcj02towgs84(point: [number, number]): [number, number] {
  if (out_of_china(point)) {
    return point;
  }

  const dlat = transformlat([point[0] - 105.0, point[1] - 35.0]);
  const dlng = transformlng([point[0] - 105.0, point[1] - 35.0]);
  const radlat = (point[1] / 180.0) * Math.PI;
  const magic = Math.sin(radlat);
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  
  const sqrtmagic = Math.sqrt(1 - ee * magic * magic);
  const mglat =
    (dlat * 180.0) / ((a * (1 - ee)) / (sqrtmagic * magic * magic) * Math.PI);
  const mglng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI);
  
  return [point[0] * 2 - (point[0] + mglng), point[1] * 2 - (point[1] + mglat)];
}

export function calcDistance(point1: GeoPoint | [number, number], point2: GeoPoint | [number, number]): number {
  const lat1 = Array.isArray(point1) ? point1[1] : point1.lat;
  const lat2 = Array.isArray(point2) ? point2[1] : point2.lat;
  const lng1 = Array.isArray(point1) ? point1[0] : point1.lng;
  const lng2 = Array.isArray(point2) ? point2[0] : point2.lng;

  const radLat1 = (lat1 * Math.PI) / 180.0;
  const radLat2 = (lat2 * Math.PI) / 180.0;
  const a = radLat1 - radLat2;
  const b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0;
  
  const s = 2 * Math.asin(
    Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2))
  );
  
  return s * 6370996.81;
}
