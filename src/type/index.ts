import { Restaurant } from 'src/entity/restaurant.entity';

export interface Coordinate {
  lat: number;
  long: number;
}
export interface PriceRange {
  min: number;
  max: number;
}
export interface RestaurantSimpleInfo {
  name: string;
  id: number;
}
export interface TextByLang {
  ISO_language_code: string;
  text: string;
}

export class RestaurantByRadius extends Restaurant {
  distance_km: number;
  delivery_time_s: number;
}
