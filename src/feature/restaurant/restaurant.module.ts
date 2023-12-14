import { Module } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { Address } from 'src/entity/address.entity';
import { RestaurantOwner } from 'src/entity/restaurant-owner.entity';
import { Media } from 'src/entity/media.entity';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { MenuItem } from 'src/entity/menu-item.entity';
import { Unit } from 'src/entity/unit.entity';
import { UnitExt } from 'src/entity/unit-ext.entity';
import { AhamoveModule } from 'src/dependency/ahamove/ahamove.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Address,
      RestaurantOwner,
      Media,
      RestaurantExt,
      MenuItem,
      Unit,
      UnitExt,
    ]),
    AhamoveModule,
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
