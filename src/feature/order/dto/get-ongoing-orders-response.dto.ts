export class GetOngoingOrdersResponse {
  ongoing_oders: OngoingOrder[];
}

export interface OngoingOrder {
  order_id: number;
  order_status_log: OrderStatusLog[];
  restaurant_info: RestaurantInfo;
  order_items: OrderItem[];
  order_total: number;
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
export interface OrderStatusLog {
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
export interface OrderItem {
  item_name: TextByLang[];
  qty_ordered: number;
}
