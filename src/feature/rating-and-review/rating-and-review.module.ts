import { Module } from '@nestjs/common';
import { RatingAndReviewController } from './rating-and-review.controller';
import { RatingAndReviewService } from './rating-and-review.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodRating } from 'src/entity/food-rating.entity';
import { Ingredient } from 'src/entity/ingredient.entity';
import { Media } from 'src/entity/media.entity';
import { MenuItemAttributeExt } from 'src/entity/menu-item-attribute-ext.entity';
import { MenuItemAttributeValue } from 'src/entity/menu-item-attribute-value.entity';
import { MenuItemAttribute } from 'src/entity/menu-item-attribute.entity';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';
import { MenuItem } from 'src/entity/menu-item.entity';
import { OrderSKU } from 'src/entity/order-sku.entity';
import { PackagingExt } from 'src/entity/packaging-ext.entity';
import { Recipe } from 'src/entity/recipe.entity';
import { SKU } from 'src/entity/sku.entity';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { DriverRating } from 'src/entity/driver-rating.entity';
import { Driver } from 'src/entity/driver.entity';
import { OrderModule } from '../order/order.module';
import { FoodModule } from '../food/food.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItem,
      MenuItemExt,
      SKU,
      Media,
      Recipe,
      Ingredient,
      OrderSKU,
      FoodRating,
      OrderSKU,
      DriverRating,
      PackagingExt,
      MenuItemAttribute,
      MenuItemAttributeExt,
      MenuItemAttributeValue,
      OrderStatusLog,
      DriverStatusLog,
      Driver,
    ]),
    OrderModule,
    FoodModule,
  ],
  controllers: [RatingAndReviewController],
  providers: [RatingAndReviewService],
  exports: [RatingAndReviewService],
})
export class RatingAndReviewModule {}
