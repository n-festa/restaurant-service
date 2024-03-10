import { GeneralResponse } from 'src/dto/general-response.dto';

export class RestaurantRecommendationResponse extends GeneralResponse {
  data: RestaurantDTO[];
}

class RestaurantDTO {
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
  having_vegeterian_food: boolean;
  max_price: number;
  min_price: number;
  unit: string;
  is_advanced_customizable: boolean;
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}
