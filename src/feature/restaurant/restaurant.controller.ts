import { Controller } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @MessagePattern({ cmd: 'get_general_restaurant_recomendation' })
  async getGeneralRestaurantRecomendation(): Promise<any> {
    return await this.restaurantService.getGeneralRestaurantRecomendation();
  }
}
