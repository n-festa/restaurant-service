import { Controller, Inject } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';

@Controller()
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
  ) {}

  @MessagePattern({ cmd: 'get_restaurant_details' })
  async getRestaurantDetails(restaurant_id: number) {
    return await this.restaurantService.getRestaurantDetails(restaurant_id);
  }
}
