import { Inject, Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class CommonService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly restaurantService: RestaurantService,
  ) {}

  async getRestaurantExtension(id: number): Promise<RestaurantExt[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      return await this.entityManager
        .createQueryBuilder(RestaurantExt, 'resExt')
        .where('resExt.restaurant_id = :id', { id })
        .getMany();
    } else {
    }
  }
}
