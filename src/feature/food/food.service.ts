import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { Repository } from 'typeorm';
import { PriceRange, RestaurantSimpleInfo } from 'src/type';
import { SKU } from 'src/entity/sku.entity';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(SKU) private skuRepo: Repository<SKU>,
  ) {}

  async getPriceRangeByMenuItem(menuItemList: number[]): Promise<PriceRange> {
    let query =
      'SELECT min(sku.price) as min, max(sku.price) as max FROM SKU as sku where sku.menu_item_id IN (' +
      menuItemList.join(',') +
      ')';
    const rawData = await this.menuItemRepo.query(query);
    console.log(rawData);
    const range: PriceRange = {
      min: rawData[0].min,
      max: rawData[0].max,
    };
    return range;
  }
  // async getFoodsWithListOfRestaurants(restaurants: RestaurantSimpleInfo[]) {
  async getFoodsWithListOfRestaurants(restaurantIds: number[]) {
    const foodList = await this.menuItemRepo
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.restaurant', 'restaurant')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'media')
      .where('menuItem.restaurant_id IN (:...restaurantIds)', { restaurantIds })
      .andWhere('menuItem.is_active = :active', { active: 1 })
      .getMany();
    // const foodListWithRestaurantExt = foodList.map((food) => {
    //   return {
    //     ...food,
    //     restaurant: {
    //       ...food.restaurant,
    //       extension: restaurants
    //         .find((res) => {
    //           return res.restaurant_id === food.restaurant_id;
    //         })
    //         .restaurant_ext.find((ext) => ext.ISO_language_code === lang),
    //     },
    //   };
    // });
    console.log(foodList);
    return foodList;
  }
}
