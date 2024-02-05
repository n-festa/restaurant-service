import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';
import { SKU } from 'src/entity/sku.entity';
import { Media } from 'src/entity/media.entity';
import { Recipe } from 'src/entity/recipe.entity';
import { Ingredient } from 'src/entity/ingredient.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { FoodRating } from 'src/entity/food-rating.entity';
import { OrderSKU } from 'src/entity/order-sku.entity';
import { Packaging } from 'src/entity/packaging.entity';
import { PackagingExt } from 'src/entity/packaging-ext.entity';
import { MenuItemAttribute } from 'src/entity/menu-item-attribute.entity';
import { MenuItemAttributeExt } from 'src/entity/menu-item-attribute-ext.entity';
import { MenuItemAttributeValue } from 'src/entity/menu-item-attribute-value.entity';
import { TasteExt } from 'src/entity/taste-ext.entity';
import { TasteValueExt } from 'src/entity/taste-value-ext.entity';
import { BasicCustomization } from 'src/entity/basic-customization.entity';
import { NoAddingExt } from 'src/entity/no-adding-ext.entity';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { SkuDetail } from 'src/entity/sku-detail.entity';
import { Restaurant } from 'src/entity/restaurant.entity';
import { OperationHours } from 'src/entity/operation-hours.entity';
import { AhamoveModule } from 'src/dependency/ahamove/ahamove.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItem,
      MenuItemExt,
      SKU,
      Media,
      Recipe,
      Ingredient,
      SkuDiscount,
      FoodRating,
      OrderSKU,
      Packaging,
      PackagingExt,
      MenuItemAttribute,
      MenuItemAttributeExt,
      MenuItemAttributeValue,
      TasteExt,
      TasteValueExt,
      BasicCustomization,
      NoAddingExt,
      RestaurantExt,
      SkuDetail,
      Restaurant,
      OperationHours,
    ]),
    AhamoveModule,
  ],
  exports: [CommonService],
  providers: [CommonService],
  controllers: [],
})
export class CommonModule {}
