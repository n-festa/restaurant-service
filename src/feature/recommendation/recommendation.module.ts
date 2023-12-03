import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { FoodModule } from '../food/food.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { AhamoveModule } from 'src/intergration/ahamove/ahamove.module';

@Module({
  imports: [FoodModule, RestaurantModule, AhamoveModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
