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

    console.log('foods', foods);

    for (const food of foods) {
      //Defind Logic of Top Label later, currently just present the vegeterian sign
      let topLabel = '';
      if (Boolean(food.is_vegetarian)) {
        topLabel = 'CHAY';
      }

      const foodNameByLang: TextByLang[] = food.menuItemExt.map((ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
      });

      const mainCookingMethodByLang: TextByLang[] = food.menuItemExt.map(
        (ext) => {
          return {
            ISO_language_code: ext.ISO_language_code,
            text: ext.main_cooking_method,
          };
        },
      );

      const restaurant = restaurants.find(
        (res) => res.restaurant_id === food.restaurant_id,
      );
      const restaurantNameByLang: TextByLang[] = restaurant.restaurant_ext.map(
        (ext) => {
          return {
            ISO_language_code: ext.ISO_language_code,
            text: ext.name,
          };
        },
      );

      const foodDTO: FoodDTO = {
        id: food.menu_item_id,
        image: food.image_obj.url,
        top_label: topLabel,
        bottom_label: null,
        name: foodNameByLang,
        restaurant_name: restaurantNameByLang,
        restaurant_id: food.restaurant_id,
        calorie_kcal: food.skus[0].calorie_kcal,
        rating: food.rating,
        distance_km: restaurant.distance_km,
        delivery_time_s: restaurant.delivery_time_s,
        main_cooking_method: mainCookingMethodByLang,
        ingredient_brief_vie: food.ingredient_brief_vie,
        ingredient_brief_eng: food.ingredient_brief_eng,
        price: food.skus[0].price,
        price_after_discount: await this.foodService.getAvailableDiscountPrice(
          food.skus[0],
        ),
        promotion: food.promotion,
        cutoff_time: food.cutoff_time,
        preparing_time_s: food.preparing_time_s,
        cooking_time_s: food.cooking_time_s,
        quantity_available: food.quantity_available,
        is_vegetarian: Boolean(food.is_vegetarian),
        cooking_schedule: food.cooking_schedule,
        units_sold: food.units_sold,
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

      const restaurantDTO: RestaurantDTO = {
        id: restaurant.restaurant_id,
        intro_video: restaurant.intro_video_obj.url,
        logo_img: restaurant.logo.url,
        name: restaurantExt.name,
        rating: restaurant.rating,
        distance_km: restaurant.distance_km,
        delivery_time_s: restaurant.delivery_time_s,
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
