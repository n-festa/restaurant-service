import { Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { PriceRange, TextByLang } from 'src/type';
import { FoodService } from '../food/food.service';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { FoodDTO } from '../../dto/food.dto';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly foodService: FoodService,
    private readonly ahamoveService: AhamoveService,
  ) {}

  async getGeneralFoodRecomendation(lat: number, long: number): Promise<any> {
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

    for (const food of foods) {
      const restaurant = restaurants.find(
        (res) => res.restaurant_id === food.restaurant_id,
      );

      const foodDTO = await this.foodService.convertIntoFoodDTO(
        food,
        restaurant,
      );

      foodDTOs.push(foodDTO);
    }

    return foodDTOs;
  }

  async getGeneralRestaurantRecomendation(
    lat,
    long,
    lang: string = 'vie',
  ): Promise<any> {
    const restaurantList: RestaurantDTO[] = [];
    const restaurants = await this.restaurantService.getRestaurantByRadius(
      lat,
      long,
      5000,
    );

    for (const restaurant of restaurants) {
      const menuItems = await restaurant.menu_items;
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
