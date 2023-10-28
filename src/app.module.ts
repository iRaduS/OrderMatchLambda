import { Module } from "@nestjs/common";

import { DeliveryRouteAlgorithmService } from "./services/deliveryRouteAlgorithm.service";
import { OrderBatchAlgorithmService } from "./services/orderBatchAlgorithm.service";
import { LinearDistanceService } from "./services/linearDistance.service";
import { GmapsRoutingService } from "./services/gmapsRouting.service";

@Module({
  providers: [
    DeliveryRouteAlgorithmService,
    OrderBatchAlgorithmService,
    LinearDistanceService,
    GmapsRoutingService
  ],
  imports: [],
})
export class AppModule {
}
