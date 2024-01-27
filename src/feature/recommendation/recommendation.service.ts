import { HttpException, Inject, Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { PriceRange } from 'src/type';
import { FoodService } from '../food/food.service';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { FoodDTO } from '../../dto/food.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { CommonService } from '../common/common.service';
import { FetchMode } from 'src/enum';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly foodService: FoodService,
    private readonly ahamoveService: AhamoveService,
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly commonService: CommonService,
  ) {}

  async getGeneralFoodRecomendationFromEndPoint(
    lat: number,
    long: number,
    fetch_mode: FetchMode = FetchMode.Some,
  ): Promise<FoodDTO[]> {
    // const response = new GeneralResponse(200, '');
    const foodDTOs: FoodDTO[] = [];
    const restaurants = await this.restaurantService.getRestaurantByRadius(
      lat,
      long,
      5000, //meter
    );
    const restauranIds = restaurants.map(
      (restaurant) => restaurant.restaurant_id,
    );

    const foods =
      await this.foodService.getFoodsWithListOfRestaurants(restauranIds);

    let fillteredFoods = [];
    switch (fetch_mode) {
      case FetchMode.Some:
        fillteredFoods = foods.slice(0, 3); // get only 3 items
        break;

      case FetchMode.Full:
        fillteredFoods = foods;
        break;

      default:
        throw new HttpException('fetch_mode is invalid', 400);
    }

    for (const food of fillteredFoods) {
      const restaurant = restaurants.find(
        (res) => res.restaurant_id === food.restaurant_id,
      );

      const foodDTO = await this.commonService.convertIntoFoodDTO(
        food,
        restaurant,
      );

      foodDTOs.push(foodDTO);
    }

    return foodDTOs;
  }

  async getGeneralRestaurantRecomendationFromEndPoint(
    lat: number,
    long: number,
    fetch_mode: FetchMode = FetchMode.Some,
  ): Promise<RestaurantDTO[]> {
    const restaurantList: RestaurantDTO[] = [];
    const restaurants = await this.restaurantService.getRestaurantByRadius(
      lat,
      long,
      5000,
    );

    let fillteredRestaurants = [];
    switch (fetch_mode) {
      case FetchMode.Some:
        fillteredRestaurants = restaurants.slice(0, 3); // get only 3 items
        break;

      case FetchMode.Full:
        fillteredRestaurants = restaurants;
        break;

      default:
        throw new HttpException('fetch_mode is invalid', 400);
    }

    for (const restaurant of fillteredRestaurants) {
      const menuItems = await restaurant.menu_items;

      //remove the restaurant which having no menu item
      if (menuItems.length <= 0) {
        continue;
      }
      const priceRange: PriceRange =
        await this.foodService.getPriceRangeByMenuItem(
          menuItems.map((item) => item.menu_item_id),
        );
      const restaurantDTO =
        await this.restaurantService.convertIntoRestaurantDTO(
          restaurant,
          priceRange,
        );

      restaurantList.push(restaurantDTO);
    }
    return restaurantList;
  }
}
