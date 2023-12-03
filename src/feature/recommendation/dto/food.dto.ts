import { TextByLang } from 'src/type';

export class FoodDTO {
  id: number;
  image: string;
  top_label: string;
  bottom_label: string;
  name: TextByLang[];
  restaurant_name: string;
  restaurant_id: number;
  kalorie: number;
  rating: number;
  distance: number;
  delivery_time: number;
  main_cooking_method: string;
  ingredients: string[];
  price: number;
  price_after_discount: number;
  promotion: string;
  cutoff_time: string;
  preparing_time_s: string;
  cooking_time_s: string;
  quantity_available: number;
  is_vegetarian: boolean;
  cooking_schedule: string;
}
