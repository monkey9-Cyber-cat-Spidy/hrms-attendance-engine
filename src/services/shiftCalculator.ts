import { AttendancePunch, ShiftPolicy, DailyAttendanceRecord } from '../types';

export class ShiftCalculator {
  public static calculateDailyRecord(
    dateStr: string,
    employeeId: string,
    punches: AttendancePunch[],
    policy: ShiftPolicy
  ): DailyAttendanceRecord {
    if (punches.length === 0) {
      return {
        date: dateStr,
        employeeId,
        totalPunches: 0,
        totalWorkMinutes: 0,
        regularMinutes: 0,
        overtimeMinutes: 0,
        isLateArrival: false,
        isEarlyDeparture: false,
        status: 'ABSENT'
      };
    }

    const sorted = [...punches].sort((a, b) => a.timestamp - b.timestamp);
    const inPunches = sorted.filter(p => p.punchType === 'IN');
    const outPunches = sorted.filter(p => p.punchType === 'OUT');

    const firstIn = inPunches.length > 0 ? inPunches[0].timestamp : undefined;
    const lastOut = outPunches.length > 0 ? outPunches[outPunches.length - 1].timestamp : undefined;

    let totalWorkMinutes = 0;
    if (firstIn && lastOut && lastOut > firstIn) {
      totalWorkMinutes = Math.floor((lastOut - firstIn) / (1000 * 60));
    }

    const expectedMinutes = policy.expectedDurationHours * 60;
    const overtimeThresholdMinutes = policy.overtimeThresholdHours * 60;

    let regularMinutes = Math.min(totalWorkMinutes, expectedMinutes);
    let overtimeMinutes = Math.max(0, totalWorkMinutes - overtimeThresholdMinutes);

    // Check late arrival
    let isLateArrival = false;
    if (firstIn) {
      const inDate = new Date(firstIn);
      const scheduledStartMinutes = policy.startHour * 60 + policy.startMinute;
      const actualStartMinutes = inDate.getHours() * 60 + inDate.getMinutes();
      if (actualStartMinutes > scheduledStartMinutes + policy.gracePeriodMinutes) {
        isLateArrival = true;
      }
    }

    // Check early departure
    let isEarlyDeparture = false;
    if (lastOut && totalWorkMinutes < expectedMinutes - 30) {
      isEarlyDeparture = true;
    }

    let status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' = 'PRESENT';
    if (totalWorkMinutes < 240) { // less than 4 hours
      status = totalWorkMinutes > 60 ? 'HALF_DAY' : 'ABSENT';
    }

    return {
      date: dateStr,
      employeeId,
      firstPunchIn: firstIn,
      lastPunchOut: lastOut,
      totalPunches: sorted.length,
      totalWorkMinutes,
      regularMinutes,
      overtimeMinutes,
      isLateArrival,
      isEarlyDeparture,
      status
    };
  }
}
