export interface PathLocation {
  address: string;
  cod: number;
  por_info: string;
  short_address: string | null;
  formatted_address: string;
  mobile: string;
  status: string;
  complete_lat: number;
  complete_lng: number;
  fail_lat: number;
  fail_lng: number;
  complete_time: number;
  fail_time: number;
  return_time: number;
  pod_info: string;
  fail_comment: string;
  name: string;
  remarks: string;
}

interface Tracking {
  _id: string;
  accept_time: number;
  board_time: number;
  cancel_by_user: boolean;
  cancel_comment: string;
  cancel_image_url: string;
  cancel_time: number;
  city_id: string;
  complete_time: number;
  create_time: number;
  currency: string;
  order_time: number;
  partner: string;
  path: PathLocation[];
  payment_method: string;
  pickup_time: number;
  service_id: string;
  status: string;
  sub_status: string;
  supplier_id: string;
  supplier_name: string;
  surcharge: number;
  user_id: string;
  user_name: string;
  total_pay: number;
  promo_code: string;
  stoppoint_price: number;
  special_request_price: number;
  vat: number;
  distance_price: number;
  voucher_discount: number;
  subtotal_price: number;
  total_price: number;
  surge_rate: number;
  api_key: string;
  shared_link: string;
  insurance_portal_url: string;
  app: string;
  store_id: number;
  distance: number;
}
