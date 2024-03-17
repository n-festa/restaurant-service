export class OrderDetailResponse {
  order_id: number;
  customer_id: number;
  restaurant: RestaurantBasicInfo;
  address: Address;
  driver_note: string;
  driver: Driver;
  order_total: number;
  delivery_fee: number;
  packaging_fee: number;
  cutlery_fee: number;
  app_fee: number;
  coupon_value: number;
  coupon_id: number;
  invoice_id: number;
  payment_method: Payment;
  payment_status_history: PaymentStatusHistory[];
  is_preorder: boolean;
  expected_arrival_time: number;
  order_items: OrderItemResponse[];
  order_status_log: OrderStatusLog[];
}
interface Driver {
  driver_id: number;
  name: string;
  phone_number: number;
  vehicle: string;
  license_plates: string;
  tracking_url: string;
  profile_image: string;
}
interface Payment {
  id: number;
  name: string;
}
interface PaymentStatusHistory {
  status_id: string;
  name: TextByLang[];
  note: string;
  created_at: number;
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
interface OrderItemResponse {
  item_name: TextByLang[];
  item_img: string;
  order_id: number;
  sku_id: number;
  qty_ordered: number;
  price: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  advanced_taste_customization: string;
  basic_taste_customization: string;
  portion_customization: string;
  notes: string;
  calorie_kcal: string;
  packaging_info: OrderItemPackaging;
}
interface OrderItemPackaging {
  packaging_id: number;
  name: TextByLang[];
  description: TextByLang[];
  price: number;
}
interface OptionSelection {
  option_id: string;
  value_id: string;
}
interface BasicTasteSelection {
  no_adding_id: string;
}
interface OrderStatusLog {
  status: string;
  description: TextByLang[];
  logged_at: number;
  milestone?: string;
}
interface RestaurantBasicInfo {
  restaurant_id: number;
  restaurant_name: TextByLang[];
  restaurant_logo_img: string;
}
interface Address {
  address_line: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}
