import { OrderItemResponse } from 'src/type';

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
  tracking_url: string;
}
interface Driver {
  driver_id: number;
  name: string;
  phone_number: string;
  vehicle: string;
  license_plates: string;
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
