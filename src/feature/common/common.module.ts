import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { FoodModule } from '../food/food.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantExt]),
    FoodModule,
    RestaurantModule,
  ],
  exports: [CommonService],
  providers: [CommonService],
  controllers: [],
})
export class CommonModule {}
