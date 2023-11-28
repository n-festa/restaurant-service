import { Injectable } from '@nestjs/common';
import { FoodRecommendationRequest } from './dto/food-recommendation-request.dto';
import { RestaurantService } from '../restaurant/restaurant.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { Repository, DataSource } from 'typeorm';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';

@Injectable()
export class FoodService {
  constructor(
    private readonly restaurantService: RestaurantService,
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
  ) {}
  async getGeneralFoodRecomendation(
    lat: number,
    long: number,
    lang: string = 'vie',
  ): Promise<any> {
    const restaurants = await this.restaurantService.getRestaurantByRadius(
      lat,
      long,
      5000, //meter
    );
    const restauranIds = restaurants.map(
      (restaurant) => restaurant.restaurant_id,
    );

    const foodList = await this.menuItemRepo
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.restaurant', 'restaurant')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .where('menuItem.restaurant_id IN (:...restauranIds)', { restauranIds })
      .andWhere('menuItem.is_active = :active', { active: 1 })
      .andWhere('menuItemExt.ISO_language_code = :lang', { lang })
      .getMany();

    const foodListWithRestaurantExt = foodList.map((food) => {
      return {
        ...food,
        restaurant: {
          ...food.restaurant,
          extension: restaurants
            .find((res) => {
              return res.restaurant_id === food.restaurant_id;
            })
            .restaurant_ext.find((ext) => ext.ISO_language_code === lang),
        },
      };
    });
    return foodListWithRestaurantExt;
  }
}
