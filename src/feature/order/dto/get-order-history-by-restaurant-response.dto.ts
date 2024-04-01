export class GetOrderHistoryByRestaurantResponse {
  hitorical_oders: HistoricalOrderByRestaurant[];
  offset: number;
  search_keyword: string;
  sort_type: string;
  filtered_order_status: string[];
  time_range: TimeRange;
  total_count: number;
}
export interface HistoricalOrderByRestaurant {
  order_id: number;
  order_status_log: OrderStatusLog[];
  restaurant_info: RestaurantInfo;
  order_items: OrderItem[];
  order_total: number;
  order_score: number;
  payment_method: Payment;
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
  restaurant_logo_img: string;
  specialty: TextByLang[];
}
interface OrderItem {
  item_name: TextByLang[];
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
  packaging_id: number;
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
interface Payment {
  id: number;
  name: string;
}
