import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
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
import { MenuItemVariant } from 'src/entity/menu-item-variant.entity';
import { MenuItemVariantExt } from 'src/entity/menu-item-variant-ext.entity';
import { MenuItemVariantOpion } from 'src/entity/menu-item-variant-option.entity';
import { TasteExt } from 'src/entity/taste-ext.entity';
import { TasteValueExt } from 'src/entity/taste-value-ext.entity';
import { SkuMenuItemVariant } from 'src/entity/sku-menu-item-variant.entity';

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
      MenuItemVariant,
      MenuItemVariantExt,
      MenuItemVariantOpion,
      TasteExt,
      TasteValueExt,
      SkuMenuItemVariant,
    ]),
  ],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
