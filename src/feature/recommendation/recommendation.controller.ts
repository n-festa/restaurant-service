import { Controller } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { MessagePattern } from '@nestjs/microservices';
import { FoodRecommendationRequest } from './dto/food-recommendation-request.dto';
import { RestaurantRecommendationRequest } from './dto/restaurant-recommendation-request.dto';

@Controller()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @MessagePattern({ cmd: 'get_general_food_recomendation' })
  async getGeneralFoodRecomendation(
    data: FoodRecommendationRequest,
  ): Promise<any> {
    return await this.recommendationService.getGeneralFoodRecomendation(
      data.lat,
      data.long,
    );
  }

  @MessagePattern({ cmd: 'get_general_restaurant_recomendation' })
  async getGeneralRestaurantRecomendation(
    inputData: RestaurantRecommendationRequest,
  ): Promise<any> {
    return await this.recommendationService.getGeneralRestaurantRecomendation(
      inputData.lat,
      inputData.long,
    );
  }
}
