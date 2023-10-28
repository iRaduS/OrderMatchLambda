import { v4 as uuidv4 } from 'uuid';
import { Injectable, Scope } from "@nestjs/common";
import { Courier } from "../types/Courier.model";
import { Order } from "../types/Order.model";
import { Batch } from "../types/Batch.model";
import { CourierActionType } from "../types/CourierAction.model";

@Injectable({ scope: Scope.REQUEST })
export class OrderBatchAlgorithmService {
  private readonly MAXIMUM_ORDERS_PER_BATCH: number = 2;

  public formBatchForCouriers(couriers: Array<Courier>, orders: Array<Order>): Array<Batch> {
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
          ]
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
    if ((firstBatch.actions.length + secondBatch.actions.length) / 2 > this.MAXIMUM_ORDERS_PER_BATCH) {
      return null;
    }

    // Corelare dupa ce avem gata partea de algoritm

    return {
      uuid: uuidv4(),
      actions: [
        ...firstBatch.actions,
        ...secondBatch.actions
      ]
    }
  }
}