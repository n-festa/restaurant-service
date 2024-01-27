import { FetchMode } from 'src/enum';

export class FoodRecommendationRequest {
  lat: number;
  long: number;
  fetch_mode: FetchMode;
}
