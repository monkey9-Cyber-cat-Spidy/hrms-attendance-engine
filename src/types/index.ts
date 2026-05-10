export type PunchType = 'IN' | 'OUT';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeofenceZone {
  zoneId: string;
  name: string;
  center: GeoLocation;
  radiusMeters: number;
}

export interface AttendancePunch {
  punchId: string;
  employeeId: string;
  timestamp: number; // Unix ms
  punchType: PunchType;
  location?: GeoLocation;
  deviceId?: string;
}

export interface ShiftPolicy {
  shiftId: string;
  shiftName: string;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  expectedDurationHours: number; // e.g. 8.0
  gracePeriodMinutes: number; // e.g. 15
  overtimeThresholdHours: number; // e.g. 8.5
}

export interface DailyAttendanceRecord {
  date: string; // YYYY-MM-DD
  employeeId: string;
  firstPunchIn?: number;
  lastPunchOut?: number;
  totalPunches: number;
  totalWorkMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  isLateArrival: boolean;
  isEarlyDeparture: boolean;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
}
