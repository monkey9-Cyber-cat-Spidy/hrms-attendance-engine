import { GeoLocation, GeofenceZone } from '../types';

export class GeofenceService {
  /**
   * Calculates Great-Circle distance between two points on Earth using Haversine formula
   * Returns distance in meters
   */
  public static calculateDistanceMeters(pointA: GeoLocation, pointB: GeoLocation): number {
    const R = 6371000; // Earth's mean radius in meters
    const lat1Rad = (pointA.latitude * Math.PI) / 180;
    const lat2Rad = (pointB.latitude * Math.PI) / 180;
    const deltaLat = ((pointB.latitude - pointA.latitude) * Math.PI) / 180;
    const deltaLon = ((pointB.longitude - pointA.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  public static isWithinGeofence(location: GeoLocation, zone: GeofenceZone): boolean {
    const distance = this.calculateDistanceMeters(location, zone.center);
    return distance <= zone.radiusMeters;
  }
}
