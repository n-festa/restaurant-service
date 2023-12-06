import { TextByLang } from 'src/type';

export class RestaurantDTO {
  id: number;
  intro_video: string;
  logo_img: string;
  name: TextByLang[];
  rating: number;
  distance_km: number;
  delivery_time_s: number;
  specialty: TextByLang[];
  top_food: string;
  promotion: string;
  cutoff_time: string[];
  having_vegeterian_food: boolean;
  max_price: number;
  min_price: number;
  unit: string;
}
