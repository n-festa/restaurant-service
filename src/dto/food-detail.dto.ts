import { Review, TextByLang, Option } from 'src/type';

export class FoodDetailDTO {
  menu_item_id: number;
  images: string[];
  name: TextByLang[];
  restaurant_name: TextByLang[];
  restaurant_id: number;
  available_quantity: number;
  units_sold: number;
  review_number: number;
  promotion: string;
  packaging_info: PackagingInfo[];
  cutoff_time_m: number;
  ingredients: Ingredient[];
  description: TextByLang[];
  portion_customization: Option[];
  taste_customization: Option[];
  other_customizaton: BasicCustomization[];
  reviews: Review[];
  is_advanced_customizable: boolean;
}

class Ingredient {
  item_name_vie: string;
  item_name_eng: string;
  quantity: number;
  unit: string;
}

class BasicCustomization {
  no_adding_id: string;
  description: TextByLang[];
}
interface PackagingInfo {
  packaging_id: number;
  image_url: string;
  name: TextByLang[];
  description: TextByLang[];
  price: number;
  currency: string;
  is_default: boolean;
}
