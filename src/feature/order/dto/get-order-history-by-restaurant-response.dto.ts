export class GetOrderHistoryByRestaurantResponse {
  hitorical_oders: HistoricalOrderByRestaurant[];
  offset: number;
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
  qty_ordered: number;
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
interface TimeRange {
  from: number; //timestamp
  to: number; //timestamp
}
