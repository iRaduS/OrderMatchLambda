import {Injectable, Scope} from "@nestjs/common";
import {
  Client
} from "@googlemaps/google-maps-services-js";

@Injectable({ scope: Scope.REQUEST })
export class gmapsRoutingService {
  
}