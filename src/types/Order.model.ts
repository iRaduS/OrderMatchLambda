import { Venue } from "./Venue.model";

export interface Order {
  uuid?: string,
  rating: number,
  pickupVenue: Venue,
  deliveryVenue: Venue,
  pickupTime: Date,
  deliveryTime: Date,
  pickupDistance: number,
  deliveryDistance: number,
  status: OrderStatusType,
  capacity: number,
  createdAt: Date,
}

enum OrderStatusType {
  PICKING_UP = "PICKING_UP",
  IN_DELIVERY = "IN_DELIVERY",
  FINISHED = "FINISHED"
}
