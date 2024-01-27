import { FetchMode } from 'src/enum';

export class RestaurantRecommendationRequest {
  lat: number;
  long: number;
  fetch_mode: FetchMode;
}
