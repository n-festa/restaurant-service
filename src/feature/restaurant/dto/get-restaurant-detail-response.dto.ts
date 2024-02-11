import { GeneralResponse } from 'src/dto/general-response.dto';

export class GetRestaurantDetailResponse extends GeneralResponse {
  data: RestaurantDetailDTO;
}
interface RestaurantDetailDTO {
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
  cutoff_time: string[];
  having_vegeterian_food: boolean;
  unit: string;
  menu: FoodDTO[];
  distance_km: number;
  delivery_time_s: number;
}

interface MediaItem {
  type: string;
  url: string;
}

interface StandardAddress {
  address_line: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Review {
  food_rating_id: number;
  score: number;
  remarks: string;
  reviewer_name?: string;
  reviewer_title?: string;
  reviewer_img?: string;
}

interface TextByLang {
  ISO_language_code: string;
  text: string;
}

interface FoodDTO {
  id: number;
  image: string;
  top_label: string;
  bottom_label: string;
  name: TextByLang[];
  restaurant_name: TextByLang[];
  restaurant_id: number;
  calorie_kcal: number;
  rating: number;
  distance_km: number;
  delivery_time_s: number;
  main_cooking_method: TextByLang[];
  ingredient_brief_vie: string;
  ingredient_brief_eng: string;
  price: number;
  price_after_discount: number;
  promotion: string;
  cutoff_time: string;
  preparing_time_s: number;
  cooking_time_s: number;
  quantity_available: number;
  is_vegetarian: boolean;
  cooking_schedule: string;
  units_sold: number;
}
