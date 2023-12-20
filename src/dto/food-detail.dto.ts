import { TextByLang } from 'src/type';

export class FoodDetailDTO {
  images: string[];
  name: TextByLang[];
  restaurant_name: TextByLang[];
  restaurant_id: number;
  available_quantity: number;
  units_sold: number;
  review_number: number;
  promotion: string;
  packaging_info: string;
  cutoff_time: string;
  ingredients: Ingredient[];
  description: TextByLang[];
  portion_customization: Option[];
  taste_customization: Option[];
  other_customizaton: BasicCustomization[];
  reviews: Review[];
}

class Ingredient {
  item_name_vie: string;
  item_name_eng: string;
  quantity: number;
  unit: string;
}

class Option {
  option_id: string;
  option_name: TextByLang[];
  option_values: OptionValue[];
}

class OptionValue {
  value_id: string;
  value_name: TextByLang[];
}

class BasicCustomization {
  basic_customization_id: string;
  description: TextByLang[];
}

class Review {
  food_rating_id: string;
  score: number;
  remarks: string;
  reviewer?: string;
}
