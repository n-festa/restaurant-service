import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, MenuItemExt]),
    RestaurantModule,
  ],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
