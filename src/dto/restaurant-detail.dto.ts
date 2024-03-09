import { MediaItem, Review, StandardAddress, TextByLang } from 'src/type';
import { FoodDTO } from './food.dto';

export class RestaurantDetailDTO {
  restaurant_id: number;
  medias: MediaItem[];
  address: StandardAddress;
  logo_img: string;
  rating: number;
  top_food: string;
  promotion: string;
  reviews: Review[];
  name: TextByLang[];
  specialty: TextByLang[];
  introduction: TextByLang[];
  review_total_count: number;
  cutoff_time_m: number;
  having_vegeterian_food: boolean;
  unit: string;
  menu: FoodDTO[];
  distance_km: number;
  delivery_time_s: number;
  is_advanced_customizable: boolean;
}
