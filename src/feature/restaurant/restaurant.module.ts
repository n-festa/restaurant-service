import { Module } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { Address } from 'src/entity/address.entity';
import { RestaurantOwner } from 'src/entity/restaurant-owner.entity';
import { Media } from 'src/entity/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Address, RestaurantOwner, Media]),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
