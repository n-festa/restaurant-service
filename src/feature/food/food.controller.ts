import { Controller, Inject } from '@nestjs/common';
import { FoodService } from './food.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';

@Controller()
export class FoodController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly foodService: FoodService,
  ) {}

  @MessagePattern({ cmd: 'get_food_detail_by_id' })
  async getFoodDetailById(id: number) {
    return await this.foodService.getFoodDetailByMenuItemId(id);
  }

  @MessagePattern({ cmd: 'get_list_of_sku_by_id' })
  async getListOfSkuById(id: number) {
    if (this.flagService.isFeatureEnabled('fes-16-get-list-of-skus')) {
      return await this.foodService.getListOfSkuById(id);
    }
    //CURRENT LOGIC
  }
}
