export interface Batch {
  uuid: string,
  actions: Array<any>,
  distanceDiff?: number
}