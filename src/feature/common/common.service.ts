import { Inject, Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { Review } from 'src/type';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { TRUE } from 'src/constant';
import { FoodRating } from 'src/entity/food-rating.entity';

@Injectable()
export class CommonService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly restaurantService: RestaurantService,
  ) {}

  async getRestaurantExtension(id: number): Promise<RestaurantExt[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      return await this.restaurantService.getRestaurantExtension(id);
    } else {
    }
  }

  async getReviewsByRestaurantId(
    restaurant_id: number[],
    limit: number,
    order: 'ASC' | 'DESC',
  ): Promise<Review[]> {
    if (this.flagService.isFeatureEnabled('fes-18-get-restaurant-detail')) {
      const reviews: Review[] = [];
      const data = await this.entityManager
        .createQueryBuilder(FoodRating, 'foodRating')
        .leftJoin('foodRating.order_sku_obj', 'orderSKU')
        .leftJoin('orderSKU.sku_obj', 'sku')
        .leftJoin('sku.menu_item', 'menuItem')
        .where('menuItem.restaurant_id = :restaurant_id', { restaurant_id })
        .andWhere('foodRating.is_active = :active', { active: TRUE })
        .select([
          'foodRating.food_rating_id',
          'foodRating.score',
          'foodRating.remarks',
        ])
        .limit(limit)
        .offset(0)
        .orderBy('foodRating.created_at', order)
        .getMany();
      for (const item of data) {
        const review: Review = {
          food_rating_id: item.food_rating_id,
          score: item.score,
          remarks: item.remarks,
        };
        reviews.push(review);
      }

      return reviews;
    }
  }
}
