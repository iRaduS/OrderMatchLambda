import { Injectable, Scope } from "@nestjs/common";
import { minimumWeightBipartiteMatch } from "min-cost-flow";

import { RequestDataType } from "../types/lambdaBase.type";
import { OrderBatchAlgorithmService } from "./orderBatchAlgorithm.service";
import { LinearDistanceService } from "./linearDistance.service";
import { CourierActionType } from "../types/CourierAction.model";
import { Batch } from "../types/Batch.model";
import { Courier } from "../types/Courier.model";

@Injectable({ scope: Scope.REQUEST })
export class DeliveryRouteAlgorithmService {
  private orderBatchAlgorithmService: OrderBatchAlgorithmService;
  private linearDistanceService: LinearDistanceService;
  private static readonly THRESHOLD_ASSIGNABLE_DISTANCE_DELIVERY: number = 0.3;

  public async startAllocationAlgorithm(inputData: RequestDataType) {
    const filteredCouriers = inputData.availableCouriers!.filter(courier => {
      if (courier.actions.length === 1 && courier.actions[0].actionType === CourierActionType.DELIVERY) {
        const distanceBetweenCourierLastAction = this.linearDistanceService.getDistanceBetweenPoints(
          courier, courier.actions[0].venue
        );
        if (distanceBetweenCourierLastAction > DeliveryRouteAlgorithmService.THRESHOLD_ASSIGNABLE_DISTANCE_DELIVERY) {
          return false;
        }
      }

      return true;
    });
    const batchOrders: Array<Batch> = this.orderBatchAlgorithmService.formBatchForCouriers(
      filteredCouriers, inputData.unassignedOrders!
    );

    const assignementResults = this.solveMinCostMatchingBipartiteGraph(filteredCouriers, batchOrders);


  }

  private solveMinCostMatchingBipartiteGraph(couriers: Array<Courier>, batches: Array<Batch>) {
    let graphEdges = [];

    for (const courier of couriers) {
      for (const batch of batches) {
        const costBetweenCourierAndBatch = this.computeScore(courier, batch);

        if (costBetweenCourierAndBatch !== null) {
          graphEdges.push({ left: courier.uuid, right: batch.uuid, cost: costBetweenCourierAndBatch })
        }
      }
    }

    return minimumWeightBipartiteMatch(graphEdges);
  }

  private computeScore(courier, batch) {
    return 0;
  }
}