import { Module } from "@nestjs/common";

import { DeliveryRouteAlgorithmService } from "./services/deliveryRouteAlgorithm.service";
import { OrderBatchAlgorithmService } from "./services/orderBatchAlgorithm.service";
import { LinearDistanceService } from "./services/linearDistance.service";

@Module({
  providers: [
    DeliveryRouteAlgorithmService,
    OrderBatchAlgorithmService,
    LinearDistanceService
  ],
  imports: [],
})
export class AppModule {
}
