import { Controller } from '@nestjs/common';
import { FoodService } from './food.service';
import { MessagePattern } from '@nestjs/microservices';
import { FoodRecommendationRequest } from './dto/food-recommendation-request.dto';

@Controller()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @MessagePattern({ cmd: 'get_general_food_recomendation' })
  async getGeneralFoodRecomendation(
    data: FoodRecommendationRequest,
  ): Promise<any> {
    return await this.foodService.getGeneralFoodRecomendation(
      data.lat,
      data.long,
    );
  }
}
