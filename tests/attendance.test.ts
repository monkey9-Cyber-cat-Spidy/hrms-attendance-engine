import request from 'supertest';
import { createApp } from '../src/server';
import { GeofenceService } from '../src/services/geofence';
import { PunchProcessor } from '../src/services/punchProcessor';
import { ShiftCalculator } from '../src/services/shiftCalculator';
import { GeofenceZone, ShiftPolicy, AttendancePunch } from '../src/types';

describe('HRMS Attendance Engine Suite', () => {
  let processor: PunchProcessor;
  let app: any;

  const testZone: GeofenceZone = {
    zoneId: 'akrivia-hq',
    name: 'Akrivia Towers Madhurawada',
    center: { latitude: 17.8184, longitude: 83.3441 },
    radiusMeters: 200
  };

  const testPolicy: ShiftPolicy = {
    shiftId: 'general-shift',
    shiftName: 'Standard 9 to 6',
    startHour: 9,
    startMinute: 30,
    expectedDurationHours: 8.5,
    gracePeriodMinutes: 15,
    overtimeThresholdHours: 9.0
  };

  beforeEach(() => {
    processor = new PunchProcessor(60000);
    const instance = createApp(processor);
    app = instance.app;
  });

  describe('Haversine Geofence Verification', () => {
    it('should accurately calculate distance and approve punch inside 200m zone', () => {
      // 50 meters away
      const insideLoc = { latitude: 17.8187, longitude: 83.3443 };
      const dist = GeofenceService.calculateDistanceMeters(insideLoc, testZone.center);
      expect(dist).toBeLessThanOrEqual(200);

      const isInside = GeofenceService.isWithinGeofence(insideLoc, testZone);
      expect(isInside).toBe(true);
    });

    it('should reject punch outside authorized geofence radius', () => {
      // 2 km away in Chinna Rushikonda
      const outsideLoc = { latitude: 17.7850, longitude: 83.3750 };
      const isInside = GeofenceService.isWithinGeofence(outsideLoc, testZone);
      expect(isInside).toBe(false);
    });
  });

  describe('Punch Debouncing & Deduplication', () => {
    it('should ignore duplicate punches sent within 60s debounce window', () => {
      const now = Date.now();
      const p1: AttendancePunch = {
        punchId: 'p1',
        employeeId: 'EMP_101',
        timestamp: now,
        punchType: 'IN'
      };
      const p2: AttendancePunch = {
        punchId: 'p2',
        employeeId: 'EMP_101',
        timestamp: now + 5000, // 5 seconds later
        punchType: 'IN'
      };

      const res1 = processor.recordPunch(p1);
      const res2 = processor.recordPunch(p2);

      expect(res1.accepted).toBe(true);
      expect(res2.accepted).toBe(false);
      expect(res2.reason).toBe('DUPLICATE_PUNCH_DEBOUNCED');
      expect(processor.getPunches('EMP_101').length).toBe(1);
    });
  });

  describe('Shift Calculation & Overtime Math', () => {
    it('should calculate 9 hours work with 0.5 hours overtime', () => {
      const base = new Date('2026-10-17T09:30:00Z').getTime();
      const punches: AttendancePunch[] = [
        { punchId: 'p_in', employeeId: 'EMP_500', timestamp: base, punchType: 'IN' },
        { punchId: 'p_out', employeeId: 'EMP_500', timestamp: base + 9.5 * 3600 * 1000, punchType: 'OUT' }
      ];

      const record = ShiftCalculator.calculateDailyRecord('2026-10-17', 'EMP_500', punches, testPolicy);
      expect(record.status).toBe('PRESENT');
      expect(record.totalWorkMinutes).toBe(570); // 9.5 hours
      expect(record.overtimeMinutes).toBe(30); // 570 - 540 = 30 mins
    });
  });

  describe('HTTP REST API Integration', () => {
    it('should return UP on /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('should accept valid punch and return summary', async () => {
      const punchData = {
        punchId: 'p_api_1',
        employeeId: 'EMP_99',
        timestamp: Date.now(),
        punchType: 'IN',
        location: { latitude: 17.8184, longitude: 83.3441 }
      };

      await request(app)
        .post('/api/attendance/punch')
        .send(punchData)
        .expect(201);

      const res = await request(app).get('/api/attendance/summary/EMP_99');
      expect(res.status).toBe(200);
      expect(res.body.employeeId).toBe('EMP_99');
      expect(res.body.totalPunches).toBe(1);
    });
  });
});
