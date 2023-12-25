import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { FoodModule } from '../food/food.module';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Global()
@Module({
  imports: [FoodModule, RestaurantModule],
  exports: [CommonService],
  providers: [CommonService],
  controllers: [],
})
export class CommonModule {}
