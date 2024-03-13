import { Restaurant } from 'src/entity/restaurant.entity';

export interface Coordinate {
  lat: number;
  long: number;
}
export interface PriceRange {
  min: number;
  max: number;
}
export interface RestaurantSimpleInfo {
  name: string;
  id: number;
}
export interface TextByLang {
  ISO_language_code: string;
  text: string;
}

export class DeliveryRestaurant extends Restaurant {
  distance_km: number;
  delivery_time_s: number;
}

export interface Review {
  food_rating_id: number;
  score: number;
  remarks: string;
  reviewer_name?: string;
  reviewer_title?: string;
  reviewer_img?: string;
}

export interface RatingStatistic {
  menu_item_id?: number;
  restaurant_id?: number;
  sku_id?: number;
  total_count: number;
  average_score: number;
  max_score: number;
  min_score: number;
}

export interface Option {
  option_id: string;
  option_name: TextByLang[];
  option_values: OptionValue[];
}

export interface OptionValue {
  value_id: string;
  value_txt?: TextByLang[];
  value_nubmer?: number;
  value_unit?: string;
  is_default?: boolean;
  order?: number;
}

export interface MediaItem {
  type: string;
  url: string;
}

export interface StandardAddress {
  address_line: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface DayShift {
  day_id: number;
  day_name: string;
  from: string;
  to: string;
  is_available?: boolean;
  // cutoff_time?: string;
  // waiting_time_s?: number; // the time a customer has to wait until the food is ready for delivery from the begining of the shift
}

export interface OptionSelection {
  option_id: string;
  value_id: string;
}

export interface BasicTasteSelection {
  no_adding_id: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  data?: any;
}

export interface UpdatedCartItem {
  item_id: number;
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
}

export interface QuantityUpdatedItem {
  item_id: number;
  qty_ordered: number;
}

export interface RestaurantBasicInfo {
  id: number;
  name: TextByLang[];
  logo_url: string;
}

export interface TimeSlot {
  dayId: number; // 1->7: Sunday -> Saturday
  dayName: string; //sun,mon,tue,wed,thu,fri,sat
  date: string;
  hours: string;
  minutes: string;
  utc_offset: number;
}
export interface ThisDate {
  dayId: number; // 1->7: Sunday -> Saturday
  date: string;
}

export interface TimeRange {
  from: number; //timestamp
  to: number; //timestamp
}

export type DayNameType = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
export type DayIdType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DeliveryInfo {
  distance_km: number;
  duration_s: number;
}

export interface FullCartItem {
  item_id: number;
  item_name: TextByLang[];
  item_img: string;
  customer_id: number;
  sku_id: number;
  price: number;
  price_after_discount: number;
  unit: string;
  qty_ordered: number;
  advanced_taste_customization: string;
  basic_taste_customization: string;
  portion_customization: string;
  advanced_taste_customization_obj: string;
  basic_taste_customization_obj: string;
  notes: string;
  restaurant_id: number;
  packaging_info: CartPackagingInfo;
}

export interface CartPackagingInfo {
  packaging_id: number;
  name: TextByLang[];
  price: number;
}

export interface AdditionalInfoForSKU {
  sku_id: number;
  sku_name: TextByLang[];
  sku_img: string;
  sku_price: number;
  sku_price_after_discount: number;
  sku_unit: string;
}
export interface PriceUnitByMenuItem {
  menu_item_id: number;
  price_unit: string;
}

export interface PackagingInfo {
  packaging_id: number;
  image_url: string;
  name: TextByLang[];
  description: TextByLang[];
  price: number;
  currency: string;
  is_default: boolean;
}

export type NumbericBoolean = 0 | 1;

export interface MoneyType {
  amount: number;
  currency: string;
}

export interface CouponAppliedItem {
  sku_id: number;
  qty_ordered: number;
  price_after_discount: number;
  packaging_price: number;
}
