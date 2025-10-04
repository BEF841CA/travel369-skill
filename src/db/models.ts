export interface User {
  id: number;
  unique_id: string;
  nickname: string | null;
  phone: string | null;
  head_url: string | null;
  token: string;
  created_at: string;
}

export interface BusLine {
  id: number;
  user_id: number;
  line_id: number;
  line_name: string;
  start_station: string;
  end_station: string;
  first_departure_time: string | null;
  last_departure_time: string | null;
  subscribed_at: string;
}

export interface BusStation {
  id: number;
  line_id: number;
  station_id: number;
  station_name: string;
  station_no: number;
  geo: string | null;
}
