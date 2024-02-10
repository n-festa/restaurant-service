import { Controller, HttpException, Inject } from '@nestjs/common';
import { FoodService } from './food.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GetSideDishRequest } from './dto/get-side-dish-request.dto';
import { GetFoodDetailResponse } from './dto/get-food-detail-response.dto';
import { GetHotFoodResponse } from './dto/get-hot-food-response.dto';
import { FoodDTO } from 'src/dto/food.dto';

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
}
