import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { RestaurantService } from '../restaurant/restaurant.service';
import { FoodService } from '../food/food.service';
import { SrestaurantDTO } from 'src/dto/s-restaurant.dto';
import { SearchResult } from 'src/dto/search-result.dto';
import { FoodDTO } from 'src/dto/food.dto';
import { PriceRange } from 'src/type';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { CommonService } from '../common/common.service';
import {
  FoodDTO as SearchFoodDTO,
  SrestaurantDTO as SearchRestaurantDTO,
} from './dto/search-food-response.dto';
import { ResultType, Filter } from './dto/search-food-request.dto';
import { MenuItem } from 'src/entity/menu-item.entity';

@Injectable()
export class SearchService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly restaurantService: RestaurantService,
    private readonly foodService: FoodService,
    private readonly commonService: CommonService,
  ) {}

  async searchFoodByName(
    keyword: string,
    ISO_language_code: string,
    lat: number,
    long: number,
    record_offset: number,
    page_size: number,
    distance_offset_m: number,
    distance_limit_m: number,
    base_distance_for_grouping_m: number,
  ): Promise<any> {
    const response = new GeneralResponse(200, '');

    //Get the total number of search result
    const foodTotalCount = +(
      await this.entityManager.query(
        `SELECT COUNT(*) AS count FROM (SELECT food_search.menu_item_id, food_search.restaurant_id, calculate_distance(${lat}, ${long}, food_search.latitude, food_search.longitude, ${base_distance_for_grouping_m}) AS distance, MATCH (food_search.name , food_search.short_name) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE) AS score FROM Food_Search AS food_search Where food_search.ISO_language_code = '${ISO_language_code}' GROUP BY menu_item_id HAVING distance > ${distance_offset_m} AND distance <= ${distance_limit_m} AND score > 0 ORDER BY distance ASC , score DESC) as subquery`,
      )
    )[0].count;

    // Search with raw SQL query in the full-search table Food_Search
    const rawData = await this.entityManager.query(
      `SELECT food_search.menu_item_id, food_search.restaurant_id, calculate_distance(${lat}, ${long}, food_search.latitude, food_search.longitude, ${base_distance_for_grouping_m}) AS distance, MATCH (food_search.name , food_search.short_name) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE) AS score FROM Food_Search AS food_search Where food_search.ISO_language_code = '${ISO_language_code}' GROUP BY menu_item_id HAVING distance > ${distance_offset_m} AND distance <= ${distance_limit_m} AND score > 0 ORDER BY distance ASC , score DESC LIMIT ${page_size} OFFSET ${record_offset}`,
    );

    //Extract list of menu_item_id and restaurant_id
    const menuItemIds = [];
    const restaurantIds = [];
    rawData.forEach((item) => {
      menuItemIds.push(item.menu_item_id);

      //Only add the uique restaurant Id
      if (
        restaurantIds.find((val) => val === item.restaurant_id) == undefined
      ) {
        restaurantIds.push(item.restaurant_id);
      }
    });

    //Get list of food and delivery restaurant data
    const foods = await this.foodService.getFoodsWithListOfMenuItem(
      menuItemIds,
      [ISO_language_code],
    );
    const deliveryRestaurants =
      await this.restaurantService.getDeliveryRestaurantByListOfId(
        restaurantIds,
        lat,
        long,
      );

    //Build FoodDTOs
    const foodDTOs: FoodDTO[] = [];
    for (const food of foods) {
      const deliveryRestaurant = deliveryRestaurants.find(
        (res) => food.restaurant_id == res.restaurant_id,
      );
      const foodDTO = await this.commonService.convertIntoFoodDTO(
        food,
        deliveryRestaurant,
      );
      foodDTOs.push(foodDTO);
    }

    //Build RestaurantDTOs
    const srestaurantDTOs: SrestaurantDTO[] = [];
    for (const restaurant of deliveryRestaurants) {
      const menuItemIds: number[] = rawData.map((item) => {
        if (item.restaurant_id == restaurant.restaurant_id) {
          return item.menu_item_id;
        }
      });
      const priceBeforeDiscountList = foodDTOs.map((food) => {
        if (menuItemIds.includes(food.id)) {
          return food.price;
        }
      });

      const priceRange: PriceRange = {
        min: Math.min(...priceBeforeDiscountList),
        max: Math.max(...priceBeforeDiscountList),
      };
      const restaurantDTO =
        await this.restaurantService.convertIntoRestaurantDTO(
          restaurant,
          priceRange,
        );
      const srestaurantDTO: SrestaurantDTO = {
        ...restaurantDTO,
        food_result: foods.map((item) => {
          if (menuItemIds.includes(item.menu_item_id)) {
            return item.menuItemExt[0].short_name;
          }
        }),
      };
      srestaurantDTOs.push(srestaurantDTO);
    }

    //Fill-up the Search Result
    const searchResult: SearchResult = {
      byFoods: foodDTOs,
      foodTotalCount: foodTotalCount,
      byRestaurants: srestaurantDTOs,
    };

    //Build response
    response.statusCode = 200;
    response.message = 'Search Food By Name successfully';
    response.data = searchResult;
    return response;
  }

  async searchFoodInGeneral(
    keyword: string,
    ISO_language_code: string,
    lat: number,
    long: number,
    distance_limit_m: number,
    base_distance_for_grouping_m: number,
    result_type: ResultType,
    filter: Filter[],
  ): Promise<SearchFoodDTO[] | SearchRestaurantDTO[]> {
    let searchResult: SearchFoodDTO[] | SearchRestaurantDTO[];
    let rawData: any;
    // Search with raw SQL query in the full-search table Food_Search
    if (keyword) {
      rawData = await this.entityManager.query(
        `SELECT food_search.menu_item_id, food_search.restaurant_id, calculate_distance(${lat}, ${long}, food_search.latitude, food_search.longitude, ${base_distance_for_grouping_m}) AS distance, MATCH (food_search.name , food_search.short_name) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE) AS score FROM Food_Search AS food_search Where food_search.ISO_language_code = '${ISO_language_code}' GROUP BY menu_item_id HAVING distance <= ${distance_limit_m} AND score > 0 ORDER BY distance ASC , score DESC`,
      );
    } else if (!keyword) {
      rawData = await this.entityManager.query(
        `SELECT food_search.menu_item_id, food_search.restaurant_id, calculate_distance(${lat}, ${long}, food_search.latitude, food_search.longitude, ${base_distance_for_grouping_m}) AS distance FROM Food_Search AS food_search Where food_search.ISO_language_code = '${ISO_language_code}' GROUP BY menu_item_id HAVING distance <= ${distance_limit_m} ORDER BY distance ASC`,
      );
    }

    //Extract list of menu_item_id and restaurant_id
    const menuItemIds = [];
    const restaurantIds = [];
    rawData.forEach((item) => {
      menuItemIds.push(item.menu_item_id);

      //Only add the unique restaurant Id
      if (
        restaurantIds.find((val) => val === item.restaurant_id) == undefined
      ) {
        restaurantIds.push(item.restaurant_id);
      }
    });

    //Get list of menu item
    const menuItems = await this.foodService.getFoodsWithListOfMenuItem(
      menuItemIds,
      [ISO_language_code],
    );

    // Get list of delivery restaurant data
    const deliveryRestaurants =
      await this.restaurantService.getDeliveryRestaurantByListOfId(
        restaurantIds,
        lat,
        long,
      );

    if (result_type === ResultType.FOOD) {
      //Filtering
      const filteredMenuItems: MenuItem[] = [];
      for (const menuItem of menuItems) {
        if (filter.includes(Filter.FROM_4STAR)) {
          if (menuItem.rating < 4) {
            continue;
          }
        }

        if (filter.includes(Filter.UPTO_500KCAL)) {
          if (Number(menuItem.skus[0].calorie_kcal) > 500) {
            continue;
          }
        }

        if (filter.includes(Filter.VEG)) {
          if (menuItem.is_vegetarian == 0) {
            continue;
          }
        }

        filteredMenuItems.push(menuItem);
      }
      //Build FoodDTOs
      const foodDTOs: SearchFoodDTO[] = [];
      for (const menuItem of filteredMenuItems) {
        const deliveryRestaurant = deliveryRestaurants.find(
          (res) => menuItem.restaurant_id == res.restaurant_id,
        );
        const foodDTO = await this.commonService.convertIntoFoodDTO(
          menuItem,
          deliveryRestaurant,
        );
        foodDTOs.push(foodDTO);
      }
      searchResult = foodDTOs;
    } else if (result_type === ResultType.RESTAURANT) {
      //Filtering
      const filteredRestaurants = [];
      for (const restaurant of deliveryRestaurants) {
        if (filter.includes(Filter.FROM_4STAR)) {
          if (restaurant.rating < 4) {
            continue;
          }
        }
        filteredRestaurants.push(restaurant);
      }
      //Build RestaurantDTOs
      const srestaurantDTOs: SearchRestaurantDTO[] = [];
      for (const restaurant of filteredRestaurants) {
        const menuItemIds: number[] = rawData.map((item) => {
          if (item.restaurant_id == restaurant.restaurant_id) {
            return item.menu_item_id;
          }
        });
        const priceBeforeDiscountList = menuItems.map((food) => {
          if (menuItemIds.includes(food.menu_item_id)) {
            return food.skus[0].price;
          }
        });

        const priceRange: PriceRange = {
          min: Math.min(...priceBeforeDiscountList),
          max: Math.max(...priceBeforeDiscountList),
        };
        const restaurantDTO =
          await this.restaurantService.convertIntoRestaurantDTO(
            restaurant,
            priceRange,
          );
        const srestaurantDTO: SearchRestaurantDTO = {
          ...restaurantDTO,
          food_result: menuItems.map((item) => {
            if (menuItemIds.includes(item.menu_item_id)) {
              return item.menuItemExt[0].short_name;
            }
          }),
        };
        srestaurantDTOs.push(srestaurantDTO);
      }
      searchResult = srestaurantDTOs;
    }
    return searchResult;
  }
}
