import express, { Application, Request, Response } from 'express';
import { PunchProcessor } from './services/punchProcessor';
import { GeofenceService } from './services/geofence';
import { ShiftCalculator } from './services/shiftCalculator';
import { AttendancePunch, GeofenceZone, ShiftPolicy } from './types';

export function createApp(processor?: PunchProcessor): { app: Application; processor: PunchProcessor } {
  const app = express();
  app.use(express.json());

  const punchProcessor = processor || new PunchProcessor();

  const defaultZone: GeofenceZone = {
    zoneId: 'akrivia-hq',
    name: 'Akrivia Towers Madhurawada',
    center: { latitude: 17.8184, longitude: 83.3441 },
    radiusMeters: 200
  };

  const defaultPolicy: ShiftPolicy = {
    shiftId: 'general-shift',
    shiftName: 'Standard 9 to 6',
    startHour: 9,
    startMinute: 30,
    expectedDurationHours: 8.5,
    gracePeriodMinutes: 15,
    overtimeThresholdHours: 9.0
  };

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'hrms-attendance-engine' });
  });

  app.post('/api/attendance/punch', (req: Request, res: Response) => {
    const punch: AttendancePunch = req.body;
    if (!punch.employeeId || !punch.punchType || !punch.timestamp) {
      res.status(400).json({ error: 'Missing mandatory punch fields' });
      return;
    }

    if (punch.location) {
      const within = GeofenceService.isWithinGeofence(punch.location, defaultZone);
      if (!within) {
        res.status(403).json({ error: 'Punch rejected: Outside authorized geofence boundary' });
        return;
      }
    }

    const result = punchProcessor.recordPunch(punch);
    if (!result.accepted) {
      res.status(422).json({ error: result.reason });
      return;
    }

    res.status(201).json({ message: 'Punch recorded successfully', punchId: punch.punchId });
  });

  app.get('/api/attendance/summary/:employeeId', (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const punches = punchProcessor.getPunches(employeeId);
    const summary = ShiftCalculator.calculateDailyRecord('2026-10-17', employeeId, punches, defaultPolicy);
    res.status(200).json(summary);
  });

  return { app, processor: punchProcessor };
}

if (require.main === module) {
  const port = process.env.PORT || 4200;
  const { app } = createApp();
  app.listen(port, () => {
    console.log(`HRMS Attendance Engine running on http://localhost:${port}`);
  });
}
