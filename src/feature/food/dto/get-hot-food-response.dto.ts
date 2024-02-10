import { GeneralResponse } from 'src/dto/general-response.dto';

export class GetHotFoodResponse extends GeneralResponse {
  data: FoodDTO[];
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

interface TextByLang {
  ISO_language_code: string;
  text: string;
}
