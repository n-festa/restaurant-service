import exp from 'constants';
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
  reviewer?: string;
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
  dayId: string;
  dayName: string;
  from: string;
  to: string;
  isAvailable?: boolean;
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
  date: Date;
  hour: string;
  minutes: string;
}
