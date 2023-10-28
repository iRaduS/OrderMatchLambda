import { Venue } from "./Venue.model";

export interface CourierAction {
  sort: number,
  status: string,
  actionType: CourierActionType,
  venue: Venue
}

export enum CourierActionType {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}
