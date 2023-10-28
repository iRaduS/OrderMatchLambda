import { Courier } from "./Courier.model";
import { Order } from "./Order.model";
import { CourierActionType } from "./CourierAction.model";

export type LambdaStructureResponseType = {
  processed?: boolean,
  statusCode?: number,
  body?: any
}

export type RequestDataType = {
  availableCouriers?: Array<Courier>,
  unassignedOrders?: Array<Order>
}

export type ResponseDataType = {
  assignmentResults?: [
    {
      courierId: string,
      orderActions: [
        {
          orderId: string,
          venueId: string,
          estimatedDistance: number,
          estimatedTime: Date,
          actionType: CourierActionType,
        }
      ]
    }
  ]
}

export type MapPoint = {
  long: number,
  lat: number
}
