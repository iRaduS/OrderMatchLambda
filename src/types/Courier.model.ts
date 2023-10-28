import {CourierAction} from "./CourierAction.model";

export interface Courier {
  uuid: string,
  name: string,
  phoneNumber: string,
  vehicleType: CourierVehicleType,
  vehicleEmission: number,
  long: number,
  lat: number,
  maxCapacity: number,
  status: CourierStatusType,
  actions: Array<CourierAction>
}

enum CourierVehicleType {
  ELECTRIC,
  CAR
}

export enum CourierStatusType {
  FREE,
  PICKUP,
  DELIVERY,
  DEACTIVATED
}
