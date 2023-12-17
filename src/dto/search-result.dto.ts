import { FoodDTO } from 'src/dto/food.dto';
import { RestaurantDTO } from './restaurant.dto';
import { SrestaurantDTO } from './s-restaurant.dto';

export class SearchResult {
  public byFoods: FoodDTO[] = [];
  public byRestaurants: Array<RestaurantDTO | SrestaurantDTO> = [];
}
