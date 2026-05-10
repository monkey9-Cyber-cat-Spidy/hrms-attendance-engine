import { AttendancePunch } from '../types';

export class PunchProcessor {
  private employeePunches: Map<string, AttendancePunch[]> = new Map();
  private debounceWindowMs: number;

  constructor(debounceWindowMs: number = 60000) { // default 60 seconds
    this.debounceWindowMs = debounceWindowMs;
  }

  public recordPunch(punch: AttendancePunch): { accepted: boolean; reason?: string } {
    if (!this.employeePunches.has(punch.employeeId)) {
      this.employeePunches.set(punch.employeeId, []);
    }

    const punches = this.employeePunches.get(punch.employeeId)!;

    if (punches.length > 0) {
      const lastPunch = punches[punches.length - 1];
      const diff = Math.abs(punch.timestamp - lastPunch.timestamp);

      // Debounce: ignore repeated punches within debounce window
      if (diff < this.debounceWindowMs && lastPunch.punchType === punch.punchType) {
        return { accepted: false, reason: 'DUPLICATE_PUNCH_DEBOUNCED' };
      }
    }

    punches.push(punch);
    return { accepted: true };
  }

  public getPunches(employeeId: string): AttendancePunch[] {
    return this.employeePunches.get(employeeId) || [];
  }

  public clear(): void {
    this.employeePunches.clear();
  }
}
