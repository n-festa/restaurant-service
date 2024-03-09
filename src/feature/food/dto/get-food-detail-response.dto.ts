import { GeneralResponse } from 'src/dto/general-response.dto';

export class GetFoodDetailResponse extends GeneralResponse {
  data: FoodDetail;
}

interface FoodDetail {
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

interface Ingredient {
  item_name_vie: string;
  item_name_eng: string;
  quantity: number;
  unit: string;
}

interface Option {
  option_id: string;
  option_name: TextByLang[];
  option_values: OptionValue[];
}

interface OptionValue {
  value_id: string;
  value_txt?: TextByLang[];
  value_nubmer?: number;
  value_unit?: string;
  is_default?: boolean;
  order?: number;
}

interface BasicCustomization {
  basic_customization_id: string;
  description: TextByLang[];
}

interface Review {
  food_rating_id: number;
  score: number;
  remarks: string;
  reviewer_name?: string;
  reviewer_title?: string;
  reviewer_img?: string;
}

interface TextByLang {
  ISO_language_code: string;
  text: string;
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
