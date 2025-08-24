export interface ApiResponse<T> {
  result: T;
  status: {
    code: number;
    msg: string;
  };
}

export interface User {
  role: number;
  token: string;
  roles: string;
  nickName: string;
  headUrl: string;
  phone: string;
  uniqueId: string;
}

export interface SearchResultItem {
  type: number;
  text1: string;
  text2: string;
  text3: string;
  waitTime: number;
  nextBus: number;
  guid: string;
  tag: string;
  img: string;
}

export interface SearchResponse {
  tip: string | null;
  result: SearchResultItem[];
  refresh: number;
}

export interface BusInfo {
  busId: number;
  lineId: number;
  name: string;
  openAirCon: boolean;
  planArrTime: string;
  planTime: string;
  quJianFlag: boolean;
  startStation: string;
  endStation: string;
}

export interface Bus {
  busId: number;
  name: string;
  lineId: number;
  stationNo: number;
  velocity: number;
  siteTime: number;
  openAirCon: boolean;
  distance: number;
  geo: string;
  icon: string;
  ratio: number;
  angle: number;
  quJian: boolean;
}

export interface Station {
  congestions: number[];
  corsTime: number;
  distance: number;
  polyline: string;
  stationNo: number;
  publicTag: string;
  road: string;
  cityId: number;
  stationId: number;
  name: string;
  subName: string;
  englishName: string;
  compass: string;
  geo: string;
  type: number;
}

export interface AdBar {
  name: string;
  picUrl: string;
  splashId: number;
  targetUrl: string;
  type: number;
}

export interface LineRealTimeInfo {
  lineId: number;
  name: string;
  backLineId: number;
  startStationName: string;
  endStationName: string;
  firstDepartureTime: string;
  lastDepartureTime: string;
  mainColor: string;
  operationType: string;
  priceCalcType: string;
  priceDiscountType: string;
  publicTag: string;
  searchPageImg: string;
  type: number;
  tagVersion: number;
  teamId: number;
  adBar: AdBar[];
  nextBus: BusInfo;
  busses: Bus[];
  stations: Station[];
}

export interface GeoPoint {
  type: number;
  lng: number;
  lat: number;
  velocity: number;
}
