enum IsoLangCode {
  VIE = 'vie',
  ENG = 'eng',
}

export interface RecipeItem {
  ingredient_id: number;

  quantity: number;

  unit_id: number;
}

interface PortionCustomizationValue {
  value: number;

  unit_id: number;

  price_variance: number; //Can be negative

  is_standard: boolean;
}

export interface PortionCustomizationItem {
  name: string;

  corresponding_ingredients: number[];

  value: PortionCustomizationValue[];
}

export interface PriceSetting {
  standard: number;
  min: number;
  max: number;
}
export interface TasteCustomizationItem {
  taste_id: string;
  taste_values: string[];
}

export class CreateMenuItemRequest {
  restaurant_id: number; //REQUIRED

  ISO_language_code: IsoLangCode; //REQUIRED

  name: string; //REQUIRED

  short_name: string; //REQUIRED

  description: string; //REQUIRED

  main_cooking_method: string; //REQUIRED

  preparing_time_minutes: number; //REQUIRED

  cooking_time_minutes: number; //REQUIRED

  is_vegetarian: boolean; //REQUIRED

  res_category_id: number; //REQUIRED

  image_url: string; //REQUIRED

  other_image_url: string[]; //OPTIONAL

  basic_customization: string[]; //REQUIRED

  recipe: RecipeItem[]; //REQUIRED

  portion_customization: PortionCustomizationItem[]; //REQUIRED

  price: PriceSetting; //REQUIRED

  taste_customization: TasteCustomizationItem[]; //REQUIRED

  packaging: number[]; //REQUIRED

  secret_key: string; //OPTIONAL
}
