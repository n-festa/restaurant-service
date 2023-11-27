import { Controller } from '@nestjs/common';
import { FoodService } from './food.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @MessagePattern({ cmd: 'get_general_food_recomendation' })
  getGeneralFoodRecomendation(): any {
    return this.foodService.getGeneralFoodRecomendation();
  }
}
