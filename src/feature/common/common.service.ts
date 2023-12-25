import { Inject, Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { DeliveryRestaurant } from 'src/type';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';

@Injectable()
export class CommonService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly restaurantService: RestaurantService,
  ) {}

  async getRestaurantExtension(id: number): Promise<RestaurantExt[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      return await this.restaurantService.getRestaurantExtension(id);
    } else {
    }
  }
}
