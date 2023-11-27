import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
  ) {}
  async getGeneralRestaurantRecomendation(): Promise<any> {
    return await this.findAll();
  }
  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepo.find();
  }
}
