import { Inject, Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { PriceRange } from 'src/type';
import { FoodService } from '../food/food.service';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { FoodDTO } from '../../dto/food.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { CommonService } from '../common/common.service';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly foodService: FoodService,
    private readonly ahamoveService: AhamoveService,
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly commonService: CommonService,
  ) {}

  async getGeneralFoodRecomendation(lat: number, long: number): Promise<any> {
    if (
      this.flagService.isFeatureEnabled(
        'fes-19-refactor-all-the-end-point-with-general-response',
      )
    ) {
      const response = new GeneralResponse(200, '');
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

        const foodDTO = await this.commonService.convertIntoFoodDTO(
          food,
          restaurant,
        );

        foodDTOs.push(foodDTO);
      }

      // Build response
      response.statusCode = 200;
      response.message = 'Get food recommendation successfully';
      response.data = foodDTOs;

      return response;
    }

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

      const foodDTO = await this.commonService.convertIntoFoodDTO(
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
    if (
      this.flagService.isFeatureEnabled(
        'fes-19-refactor-all-the-end-point-with-general-response',
      )
    ) {
      const response = new GeneralResponse(200, '');

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

      //Build response
      response.statusCode = 200;
      response.message = 'Get restaurant recommendation successfully';
      response.data = restaurantList;
      return response;
    }

    // CURRENT LOGIC
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
