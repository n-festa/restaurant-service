export class GetOrderHistoryByFoodResponse {
  hitorical_oders: HistoricalOrderByFood[];
  offset: number;
  search_keyword: string;
  sort_type: string;
  filtered_order_status: string[];
  time_range: TimeRange;
  total_count: number;
}

export interface HistoricalOrderByFood {
  order_id: number;
  order_status_log: OrderStatusLog[];
  restaurant_info: RestaurantInfo;
  name: TextByLang[];
  image: string;
  main_cooking_method: TextByLang[];
  ingredient_brief_vie: string;
  ingredient_brief_eng: string;
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization: string;
  basic_taste_customization: string;
  portion_customization: string;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
  packaging_id: number;
  price: number;
  calorie_kcal: string;
  score: number;
}
interface OrderStatusLog {
  status: string;
  description: TextByLang[];
  logged_at: number;
  milestone?: string;
}
interface RestaurantInfo {
  restaurant_id: number;
  restaurant_name: TextByLang[];
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
interface TimeRange {
  from: number; //timestamp
  to: number; //timestamp
}
interface OptionSelection {
  option_id: string;
  value_id: string;
}
interface BasicTasteSelection {
  no_adding_id: string;
}
