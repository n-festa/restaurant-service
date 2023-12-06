import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysCategory } from 'src/entity/sys-category.entity';
import { SysCategoryExt } from 'src/entity/sys-category-ext.entity';
import { SysCategoryMenuItem } from 'src/entity/sys-category-menu-item.entity';
import { FoodModule } from '../food/food.module';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysCategory,
      SysCategoryExt,
      SysCategoryMenuItem,
    ]),
    FoodModule,
    RestaurantModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
