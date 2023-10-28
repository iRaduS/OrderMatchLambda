export interface Venue {
  uuid?: string,
  name: string,
  typeOfVenue: VenueTypeData,
  long: number,
  lat: number,
  isDonating: boolean
}

enum VenueTypeData {
  RESTAURANT,
  MARKETPLACE,
  FOOD_BANK,
  SHELTER
}
