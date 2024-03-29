export interface AhamoveLocation {
  address: string;
  lat: number;
  lng: number;
  name: string;
  mobile: string;
  cod: number;
  formatted_address: string;
  short_address: string;
  address_code: null | string;
  remarks: string;
  item_value: number;
  require_pod?: boolean; // Optional property
}

export interface AhaMoveRequest {
  _id: string;
}

export interface Item {
  _id: string;
  num: number;
  name: string;
  price: number;
}

export interface PackageDetail {
  weight: number;
  length: number;
  width: number;
  height: number;
  description: string;
}

export interface AhamoveOrder {
  service_id: string;
  path: AhamoveLocation[];
  requests?: AhaMoveRequest[];
  payment_method: string;
  total_pay: number;
  order_time: number;
  promo_code: null | string;
  remarks: string;
  admin_note: string;
  route_optimized: boolean;
  idle_until: number;
  items: Item[];
  package_detail: PackageDetail[];
  group_service_id: null | string;
  group_requests: null | string;
  order_id?: string;
  response: string;
  shared_link?: string;
}

export interface PostAhaOrderRequest {
  startingPoint: AhamoveLocation;
  destination: AhamoveLocation;
  paymentMethod: string;
  totalPay: number;
  orderTime: number;
  promoCode: null | string;
  remarks: string;
  adminNote: string;
  routeOptimized: boolean;
  idleUntil: number;
  items: Item[];
  packageDetails: PackageDetail[];
  groupServiceId: null | string;
  groupRequests: null | string;
  serviceType: null | string;
}
