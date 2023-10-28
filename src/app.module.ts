import { Module } from "@nestjs/common";

import { DeliveryRouteAlgorithmService } from "./services/deliveryRouteAlgorithm.service";
import { OrderBatchAlgorithmService } from "./services/orderBatchAlgorithm.service";

@Module({
  providers: [
    DeliveryRouteAlgorithmService,
    OrderBatchAlgorithmService
  ],
  imports: [],
})
export class AppModule {
}
