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
    ]),
  ],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
