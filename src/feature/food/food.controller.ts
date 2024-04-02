import { Controller, HttpException, Inject, UseFilters } from '@nestjs/common';
import { FoodService } from './food.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GetSideDishRequest } from './dto/get-side-dish-request.dto';
import { GetFoodDetailResponse } from './dto/get-food-detail-response.dto';
import { GetHotFoodResponse } from './dto/get-hot-food-response.dto';
import { FoodDTO } from 'src/dto/food.dto';
import { GetAvailableFoodByRestaurantRequest } from './dto/get-available-food-by-restaurant-request.dto';
import { GetAvailableFoodByRestaurantResponse } from './dto/get-available-food-by-restaurant-response.dto';
import { GetSimilarFoodRequest } from './dto/get-similar-food-request.dto';
import { GetSimilarFoodResponse } from './dto/get-similar-food-response.dto';
import { CustomRpcExceptionFilter } from 'src/filters/custom-rpc-exception.filter';

@Controller()
export class FoodController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly foodService: FoodService,
  ) {}

  @MessagePattern({ cmd: 'get_food_detail_by_id' })
  async getFoodDetailById(id: number): Promise<GetFoodDetailResponse> {
    return await this.foodService.getFoodDetailByMenuItemId(id);
  } // end of getFoodDetailById

  @MessagePattern({ cmd: 'get_list_of_sku_by_id' })
  async getListOfSkuById(id: number) {
    return await this.foodService.getListOfSkuById(id);
  } // end of getListOfSkuById

  @MessagePattern({ cmd: 'get_side_dish_by_menu_item_id' })
  async getSideDishByMenuItemId(data: GetSideDishRequest) {
    return await this.foodService.getSideDishByMenuItemId(data);
  } //end of getSideDishByMenuItemId

  @MessagePattern({ cmd: 'get_hot_food' })
  async getHotFood(): Promise<GetHotFoodResponse> {
    const res = new GetHotFoodResponse(200, '');
    try {
      const foods: FoodDTO[] = await this.foodService.getHotFoodFromEndPoint();
      res.statusCode = 200;
      res.message = 'Get hot food successfully';
      res.data = foods;
    } catch (error) {
      if (error instanceof HttpException) {
        res.statusCode = error.getStatus();
        res.message = error.getResponse();
        res.data = null;
      } else {
        res.statusCode = 500;
        res.message = error.toString();
        res.data = null;
      }
    }
    return res;
  } // end of getHotFood

  @MessagePattern({ cmd: 'get_available_food_by_restaurant' })
  async getAvailableFoodByRestaurant(
    data: GetAvailableFoodByRestaurantRequest,
  ): Promise<GetAvailableFoodByRestaurantResponse> {
    const res = new GetAvailableFoodByRestaurantResponse(200, '');
    const { menu_item_id, fetch_mode } = data;
    const timestamp = Date.now();
    try {
      if (!menu_item_id) {
        res.statusCode = 400;
        res.message = 'Missing menu_item_id';
        res.data = null;
        return res;
      }
      const foods: FoodDTO[] =
        await this.foodService.getAvailableFoodByRestaurantFromEndPoint(
          menu_item_id,
          timestamp,
          fetch_mode,
        );
      res.statusCode = 200;
      res.message = 'Get available food by restaurant successfully';
      res.data = foods;
    } catch (error) {
      if (error instanceof HttpException) {
        res.statusCode = error.getStatus();
        res.message = error.getResponse();
        res.data = null;
      } else {
        res.statusCode = 500;
        res.message = error.toString();
        res.data = null;
      }
    }

    return res;
  } // end of getAvailableFoodByRestaurant

  @MessagePattern({ cmd: 'get_similar_food' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getSimilarFood(
    data: GetSimilarFoodRequest,
  ): Promise<GetSimilarFoodResponse> {
    const { menu_item_id, fetch_mode } = data;
    const similarMenuItemIds = await this.foodService.getSimilarMenuItems(
      menu_item_id,
      fetch_mode,
    );
    return await this.foodService.buildSimilarFoodResponse(similarMenuItemIds);
  }
}
