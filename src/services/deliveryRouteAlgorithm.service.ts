import { Injectable, Scope } from "@nestjs/common";
import { minimumWeightBipartiteMatch } from "min-cost-flow";

import { RequestDataType, ResponseDataType } from "../types/lambdaBase.type";
import { OrderBatchAlgorithmService } from "./orderBatchAlgorithm.service";
import { LinearDistanceService } from "./linearDistance.service";
import { CourierActionType } from "../types/CourierAction.model";
import { Batch } from "../types/Batch.model";
import { Courier, CourierVehicleType } from "../types/Courier.model";
import { GmapsRoutingService } from "./gmapsRouting.service";

@Injectable({ scope: Scope.REQUEST })
export class DeliveryRouteAlgorithmService {
  constructor(
    private orderBatchAlgorithmService: OrderBatchAlgorithmService,
    private linearDistanceService: LinearDistanceService,
    private gmapsRoutingService: GmapsRoutingService,
  ) {}
  private static readonly THRESHOLD_ASSIGNABLE_DISTANCE_DELIVERY: number = 0.3;
  private readonly EMPTY_DISTANCE_COURIER: number = 5;
  private readonly BASED_EDGE_COST: number = 1000;

  public async startAllocationAlgorithm(inputData: RequestDataType): Promise<ResponseDataType> {
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

    const assignmentResults = this.solveMinCostMatchingBipartiteGraph(filteredCouriers, batchOrders);
    const formattedAssignmentsResults = this.formResultAssignmentResponse(assignmentResults, batchOrders)

    let finalListForAssignment = {};
    const requestDate = new Date();
    for (const formattedAssignmentsResult of formattedAssignmentsResults) {
      const courier = filteredCouriers.filter(filteredCourier => filteredCourier.uuid === formattedAssignmentsResult.courierId)[0]
      const startingPoint = courier.actions.length ? { lat: courier.actions[0].venue.lat, lng: courier.actions[0].venue.long } :
        { lat: courier.lat, lng: courier.long }

      const results = await this.gmapsRoutingService.directions({
        locations: [startingPoint, ...formattedAssignmentsResult.orderActions.map(orderAction =>
          ({ lat: orderAction.venueLocation.lat, lng: orderAction.venueLocation.long })
        )]
      })

      let distanceLegs = 0;
      let durationLegs = 0;
      finalListForAssignment[courier.uuid] = {
        courierId: courier.uuid, orderActions: formattedAssignmentsResult.orderActions.map((orderAction, index) => {
          distanceLegs += results.legs[index].distance;
          durationLegs += results.legs[index].duration;

          return {
            orderId: orderAction.orderId,
            venueId: orderAction.venueLocation.uuid,
            estimatedDistance: distanceLegs / 1000,
            estimatedTime: requestDate.setSeconds(requestDate.getSeconds() + durationLegs),
            actionType: orderAction.actionType
          }
        })
      }
    }

    return {
      assignmentResults: Object.values(finalListForAssignment)
    };
  }

  private solveMinCostMatchingBipartiteGraph(couriers: Array<Courier>, batches: Array<Batch>) {
    let graphEdges = [];

    for (const courier of couriers) {
      for (const batch of batches) {
        const costBetweenCourierAndBatch = this.computeScore(courier, batch);

        if (costBetweenCourierAndBatch !== null) {
          graphEdges.push({ left: courier.uuid!, right: batch.uuid, weight: costBetweenCourierAndBatch })
        }
      }
    }

    return minimumWeightBipartiteMatch(graphEdges);
  }

  private computeScore(courier: Courier, batch: Batch) {
    const distanceToFirstBatchAction = this.linearDistanceService.getDistanceBetweenPoints(courier, batch.actions[0].venueLocation);
    if (distanceToFirstBatchAction > this.EMPTY_DISTANCE_COURIER) {
      return null;
    }

    const pollutionScoreFactor = courier.vehicleType === CourierVehicleType.ELECTRIC ? 0 :
      this.linearDistanceService.getBatchConfigurationDistance(batch.actions) * courier.vehicleEmission;
    return this.BASED_EDGE_COST + distanceToFirstBatchAction + pollutionScoreFactor;
  }

  private formResultAssignmentResponse(assignmentResults, batchOrders: Array<Batch>) {
    let assignationValues = {};

    for (const assignmentResult of assignmentResults) {
      if (!assignationValues.hasOwnProperty(assignmentResult.left)) {
        assignationValues[assignmentResult.left] = { courierId: assignmentResult.left, orderActions: [] } ;
      }

      assignationValues[assignmentResult.left].orderActions = batchOrders
          .filter(batch => batch.uuid === assignmentResult.right)
          .flatMap(batch => batch.actions)

      const distanceDiffForCurrentBatch = batchOrders
        .filter(batch => batch.uuid === assignmentResult.right)[0]
        .distanceDiff!
      if (distanceDiffForCurrentBatch) {
        assignationValues[assignmentResult.left].distanceDiff = distanceDiffForCurrentBatch;
      }
    }

    return Object.values(assignationValues);
  }
}
