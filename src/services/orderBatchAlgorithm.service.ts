import { v4 as uuidv4 } from 'uuid';
import { Injectable, Scope } from "@nestjs/common";
import { Courier } from "../types/Courier.model";
import { Order } from "../types/Order.model";
import { Batch } from "../types/Batch.model";
import { CourierActionType } from "../types/CourierAction.model";
import { LinearDistanceService } from "./linearDistance.service";

@Injectable({ scope: Scope.REQUEST })
export class OrderBatchAlgorithmService {
  constructor(
    private linearDistanceService: LinearDistanceService
  ) {}
  private readonly MAXIMUM_ORDERS_PER_BATCH: number = 2;
  private readonly ABSOLUTE_DEVIATION_FACTOR: number = 1.2;
  private readonly MAXIMUM_DISTANCE_BETWEEN_SEGMENTS: number = 3.5;

  public formBatchForCouriers(couriers: Array<Courier>, orders: Array<Order>): Array<Batch> {
    console.log(orders);
    console.log(couriers);
    let batchedOrderList: Array<Batch> = orders.map(order => {
        return {
          uuid: uuidv4(),
          actions: [
            {
              orderId: order.uuid,
              actionType: CourierActionType.PICKUP,
              venueLocation: order.pickupVenue
            },
            {
              orderId: order.uuid,
              actionType: CourierActionType.DELIVERY,
              venueLocation: order.deliveryVenue
            }
          ],
        } as Batch
      }),
      formNewBatch = this.findMatchingBatch(batchedOrderList);
    while (formNewBatch !== null) {
      batchedOrderList = [
        ...batchedOrderList.filter(batchedOrder => !formNewBatch!.components.includes(batchedOrder)),
        formNewBatch.batch
      ];
      formNewBatch = this.findMatchingBatch(batchedOrderList);
    }

    return batchedOrderList;
  }

  private findMatchingBatch(batchedOrderList: Array<Batch>) {
    for (let i = 1; i < batchedOrderList.length; ++i) {
      for (let j = 0; j < i; ++j) {
        const newResultingBatch = this.testConfigurationBatch(batchedOrderList[i], batchedOrderList[j]);
        if (newResultingBatch !== null) {
          return { batch: newResultingBatch, components: [batchedOrderList[i], batchedOrderList[j]] }
        }
      }
    }

    return null;
  }

  private testConfigurationBatch(firstBatch: Batch, secondBatch: Batch): Batch | null
  {
    const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
    const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))
    const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))

    if ((firstBatch.actions.length + secondBatch.actions.length) / 2 > this.MAXIMUM_ORDERS_PER_BATCH) {
      return null;
    }

    const computeMatchingConfigurations = [
      [firstBatch.actions[0], firstBatch.actions[1], secondBatch.actions[0], secondBatch.actions[1]],
      [firstBatch.actions[0], secondBatch.actions[0], firstBatch.actions[1], secondBatch.actions[1]],
      [secondBatch.actions[0], secondBatch.actions[1], firstBatch.actions[0], firstBatch.actions[1]],
      [firstBatch.actions[0], secondBatch.actions[0], secondBatch.actions[1], firstBatch.actions[1]],
      [secondBatch.actions[0], firstBatch.actions[0], firstBatch.actions[1], secondBatch.actions[1]],
      [secondBatch.actions[0], firstBatch.actions[0], secondBatch.actions[1], firstBatch.actions[1]],
    ]
    const distancesForBatch = computeMatchingConfigurations
      .map(computeMatchingConfiguration =>
        this.linearDistanceService.getBatchConfigurationDistance(computeMatchingConfiguration)
      )
    const orderedActions = computeMatchingConfigurations[argMin(distancesForBatch)];

    for (let i = 2; i < orderedActions.length; ++i) {
      if (this.linearDistanceService.computeDeviationEstimation(
        orderedActions[i - 2], orderedActions[i - 1], orderedActions[i]
      ) > this.ABSOLUTE_DEVIATION_FACTOR) {
        return null;
      }
    }

    for (let i = 1; i < orderedActions.length; ++i) {
      if (this.linearDistanceService.getDistanceBetweenPoints(
        orderedActions[i - 1].venueLocation, orderedActions[i].venueLocation
      ) > this.MAXIMUM_DISTANCE_BETWEEN_SEGMENTS) {
        return null;
      }
    }

    return {
      uuid: uuidv4(),
      actions: [
        ...orderedActions
      ],
      distanceDiff: distancesForBatch[argMax(distancesForBatch)] - distancesForBatch[argMin(distancesForBatch)]
    }
  }
}