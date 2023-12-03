import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';
import { SKU } from 'src/entity/sku.entity';
import { Media } from 'src/entity/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuItemExt, SKU, Media])],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
