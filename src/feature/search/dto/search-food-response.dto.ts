export class SearchFoodResponse {
  results: FoodDTO[] | SrestaurantDTO[];
  keyword: string;
  ISO_language_code: string;
  lat: string;
  long: string;
  result_type: string;
  sort_type: string;
  filter: string[];
  offset: number;
  total: number;
  distance_limit_m: number;
  base_distance_for_grouping_m: number;
}

export interface FoodDTO {
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
  preparing_time_s: number;
  cooking_time_s: number;
  quantity_available: number;
  is_vegetarian: boolean;
  cooking_schedule: string;
  units_sold: number;
  is_advanced_customizable: boolean;
}
export interface SrestaurantDTO {
  id: number;
  intro_video: string;
  logo_img: string;
  name: TextByLang[];
  rating: number;
  distance_km: number;
  delivery_time_s: number;
  specialty: TextByLang[];
  top_food: string;
  promotion: string;
  having_vegeterian_food: boolean;
  max_price: number;
  min_price: number;
  unit: string;
  is_advanced_customizable: boolean;
  food_result: string[];
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
