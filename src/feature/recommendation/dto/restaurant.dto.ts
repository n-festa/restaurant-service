export class RestaurantDTO {
  id: number;
  intro_video: string;
  logo_img: string;
  name: string;
  rating: number;
  distance: number;
  delivery_time: number;
  specialty: string;
  top_food: string;
  promotion: string;
  cutoff_time: string[];
  having_vegeterian_food: boolean;
  max_price: number;
  min_price: number;
  unit: string;
}
