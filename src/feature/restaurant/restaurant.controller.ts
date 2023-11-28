import { Controller } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { MessagePattern } from '@nestjs/microservices';
import { RestaurantRecommendationRequest } from './dto/restaurant-recommendation-request.dto';

@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @MessagePattern({ cmd: 'get_general_restaurant_recomendation' })
  async getGeneralRestaurantRecomendation(
    inputData: RestaurantRecommendationRequest,
  ): Promise<any> {
    return await this.restaurantService.getGeneralRestaurantRecomendation(
      inputData,
    );
  }
}
