import { Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantDTO } from './dto/restaurant.dto';
import { PriceRange, TextByLang } from 'src/type';
import { FoodService } from '../food/food.service';
import { AhamoveService } from 'src/intergration/ahamove/ahamove.service';
import { FoodDTO } from './dto/food.dto';

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
      //Defind Logic of Top Label later, currently just present the vegeterian sign
      let topLabel = '';
      if (Boolean(food.is_vegetarian)) {
        topLabel = 'CHAY';
      }

      const foodExt = await food.menuItemExt;
      const nameByLang: TextByLang[] = foodExt.map((ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
      });

      const foodDTO: FoodDTO = {
        id: food.menu_item_id,
        image: food.image_obj.url,
        top_label: topLabel,
        bottom_label: null, //???
        name: nameByLang, //???
        restaurant_name: null, //???
        restaurant_id: null, //???
        kalorie: null, //???
        rating: null, //???
        distance: null, //???
        delivery_time: null, //???
        main_cooking_method: null, //???
        ingredients: null, //???
        price: null, //???
        price_after_discount: null, //???
        promotion: null, //???
        cutoff_time: null, //???
        preparing_time_s: null, //???
        cooking_time_s: null, //???
        quantity_available: null, //???
        is_vegetarian: Boolean(food.is_vegetarian), //???
        cooking_schedule: null, //???
      };
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
      // console.log(await restaurant.menu_items);
      const restaurantExt = restaurant.restaurant_ext.find(
        (ext) => ext.ISO_language_code === lang,
      );
      const menuItems = await restaurant.menu_items;
      let having_vegeterian_food: boolean = false;
      const menuItemIds: number[] = [];
      for (const menuItem of menuItems) {
        if (menuItem.is_vegetarian === 1) {
          having_vegeterian_food = true;
        }
        menuItemIds.push(menuItem.menu_item_id);
      }
      const priceRange: PriceRange =
        await this.foodService.getPriceRangeByMenuItem(menuItemIds);
      const timeAnhDistance = await this.ahamoveService.estimateTimeAndDistance(
        {
          lat: lat,
          long: long,
        },
        {
          lat: Number(restaurant.address.latitude),
          long: Number(restaurant.address.longitude),
        },
      );
      const restaurantDTO: RestaurantDTO = {
        id: restaurant.restaurant_id,
        intro_video: restaurant.intro_video_obj.url,
        logo_img: restaurant.logo.url,
        name: restaurantExt.name,
        rating: restaurant.rating,
        distance: timeAnhDistance.distance, //km
        delivery_time: timeAnhDistance.duration, //minutes
        specialty: restaurantExt.specialty,
        top_food: restaurant.top_food,
        promotion: restaurant.promotion,
        cutoff_time: menuItems.map((item) => item.cutoff_time),
        having_vegeterian_food: having_vegeterian_food,
        max_price: priceRange.max,
        min_price: priceRange.min,
        unit: restaurant.unit_obj.symbol,
      };
      restaurantList.push(restaurantDTO);
    }

    return restaurantList;
  }
}
