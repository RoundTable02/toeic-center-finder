export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location extends Coordinates {
  id: number | string;
  name: string;
  examType: string;
  examDate: string;
  location: string;
  address: string;
  distance?: number;
}

export interface ExamSchedule {
  exam_code: string;
  exam_day: string;
}

export interface ApiCenterInfo {
  center_code: string;
  center_name: string;
  address: string;
}
