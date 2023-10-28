import { Injectable, Scope } from "@nestjs/common";
import { MapPoint } from "../types/lambdaBase.type";

@Injectable({ scope: Scope.REQUEST })
export class LinearDistanceService {
  public static readonly EARTH_RADIUS_KM: number = 6371;

  public getDistanceBetweenPoints(firstPoint: MapPoint, secondPoint: MapPoint) {
    const [firstLat, secondLat, firstLong, secondLong] = [
      LinearDistanceService.toRadians(firstPoint.lat), LinearDistanceService.toRadians(secondPoint.lat),
      LinearDistanceService.toRadians(firstPoint.long), LinearDistanceService.toRadians(secondPoint.long)
    ];
    const [latDiff, longDiff] = [firstLat - secondLat, firstLong - secondLong];

    const computeMetric = Math.sin(latDiff / 2) ** 2 +
      Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(longDiff / 2) ** 2;

    return LinearDistanceService.EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(computeMetric), Math.sqrt(1 - computeMetric))
  }

  public getBatchConfigurationDistance(batchPoints: Array<any>) {
    let totalDistance: number = 0;
    for (let i = 1; i < batchPoints.length; ++i) {
      totalDistance += this.getDistanceBetweenPoints(batchPoints[i - 1].venueLocation, batchPoints[i].venueLocation);
    }
    return totalDistance;
  }

  private static toRadians(degrees: number) {
    return degrees * Math.PI / 180.0;
  }
}