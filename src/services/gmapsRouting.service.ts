import {Injectable, Scope} from "@nestjs/common";
import {
  Client, DirectionsRequest, DirectionsRoute, Status, TravelMode
} from "@googlemaps/google-maps-services-js";
import { DirectionsRequestType, DirectionsResponseType } from "../types/lambdaBase.type";

@Injectable({ scope: Scope.REQUEST })
export class GmapsRoutingService {
  public async directions(request: DirectionsRequestType): Promise<DirectionsResponseType> {
    const origin = request.locations[0];
    const destination = request.locations[request.locations.length - 1];
    const waypoints = request.locations.slice(1, request.locations.length - 1);

    const client = new Client();
    const requestData: DirectionsRequest = {
      params: {
        origin: origin,
        destination: destination,
        waypoints,
        alternatives: true,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: TravelMode.driving,
      },
    };

    try {
      const response = await client.directions(requestData);
      const data = response.data;

      if (data.status !== Status.OK) {
        throw new Error(data.status);
      }

      const bestRoute = GmapsRoutingService.getBestRoute(data.routes);
      const legs = bestRoute.legs.map(leg => ({
        distance: leg.distance.value,
        duration: leg.duration.value,
      }));

      return {
        distance: legs.map(l => l.distance).reduce((i, a) => i + a, 0),
        duration: legs.map(l => l.duration).reduce((i, a) => i + a, 0),
        legs: legs,
      };
    } catch (e) {
      console.error(e?.message);
      console.error(e?.response?.data);
      if (e?.response?.data?.error_message) {
        throw new Error('Google Maps error: ' + e?.response?.data?.error_message);
      }
      throw e;
    }
  }

  private static getBestRoute(routes: DirectionsRoute[]): DirectionsRoute {
    routes.sort((a, b) => {
      return b.legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.duration.value, 0) - a.legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.duration.value, 0);
    });

    const bestTimeRouteDuration = routes[0].legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.duration.value, 0) / 60;

    const worstTimeRoute = routes.pop();
    routes.push(worstTimeRoute);

    const worstTimeRouteDuration = worstTimeRoute.legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.duration.value, 0) / 60;
    if ((worstTimeRouteDuration - bestTimeRouteDuration) > 5) {
      return routes[0];
    }
    routes.sort((a, b) => {
      return a.legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.distance.value, 0) - b.legs.reduce((partialSum, currentLeg) => partialSum + currentLeg.distance.value, 0);
    });
    return routes[0];
  }
}