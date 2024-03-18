interface Address {
  address_line: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface OrderItemRequest {
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
  packaging_id: number;
}

interface OptionSelection {
  option_id: string;
  value_id: string;
}
interface BasicTasteSelection {
  no_adding_id: string;
}

export class CreateOrderRequest {
  customer_id: number;
  restaurant_id: number;
  address: Address;
  order_total: number;
  delivery_fee: number;
  packaging_fee: number;
  cutlery_fee: number;
  app_fee: number;
  coupon_value: number;
  coupon_code: string;
  payment_method_id: number;
  expected_arrival_time: number;
  driver_note: string;
  order_items: OrderItemRequest[];
}
