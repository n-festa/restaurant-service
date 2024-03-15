import { Controller, HttpException, Logger } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { MessagePattern } from '@nestjs/microservices';
import { FoodRecommendationRequest } from './dto/food-recommendation-request.dto';
import { RestaurantRecommendationRequest } from './dto/restaurant-recommendation-request.dto';
import { FoodRecommendationResponse } from './dto/food-recommendation-response.dto';
import { RestaurantRecommendationResponse } from './dto/restaurant-recommendation-response.dto';

@Controller()
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);
  constructor(private readonly recommendationService: RecommendationService) {}

  @MessagePattern({ cmd: 'get_general_food_recomendation' })
  async getGeneralFoodRecomendation(
    data: FoodRecommendationRequest,
  ): Promise<FoodRecommendationResponse> {
    const res = new FoodRecommendationResponse(200, '');
    try {
      const food =
        await this.recommendationService.getGeneralFoodRecomendationFromEndPoint(
          data.lat,
          data.long,
          data.fetch_mode,
        );
      res.statusCode = 200;
      res.message = 'Get food recommendation successfully';
      res.data = food;
    } catch (error) {
      this.logger.error(error);
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
  } // end of getGeneralFoodRecomendation

  @MessagePattern({ cmd: 'get_general_restaurant_recomendation' })
  async getGeneralRestaurantRecomendation(
    inputData: RestaurantRecommendationRequest,
  ): Promise<RestaurantRecommendationResponse> {
    const res = new RestaurantRecommendationResponse(200, '');

    try {
      const restaurants =
        await this.recommendationService.getGeneralRestaurantRecomendationFromEndPoint(
          inputData.lat,
          inputData.long,
          inputData.fetch_mode,
        );
      res.statusCode = 200;
      res.message = 'Get restaurant recommendation successfully';
      res.data = restaurants;
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
  } // end of getGeneralRestaurantRecomendation
}
