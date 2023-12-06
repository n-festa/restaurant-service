import { FoodDTO } from 'src/feature/recommendation/dto/food.dto';

export class SearchResult {
  public byFoods: FoodDTO[] = [];
  public byRestaurants: any[] = [];
}
