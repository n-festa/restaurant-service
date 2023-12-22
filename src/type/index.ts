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

export class DeliveryRestaurant extends Restaurant {
  distance_km: number;
  delivery_time_s: number;
}

export interface Review {
  food_rating_id: number;
  score: number;
  remarks: string;
  reviewer?: string;
}

export interface RatingStatistic {
  menu_item_id?: number;
  restaurant_id?: number;
  sku_id?: number;
  total_count: number;
  average_score: number;
  max_score: number;
  min_score: number;
}
