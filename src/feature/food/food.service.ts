import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PriceRange, RestaurantSimpleInfo } from 'src/type';
import { SKU } from 'src/entity/sku.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { PERCENTAGE } from 'src/constant/unit.constant';
import { TRUE } from 'src/constant';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(SKU) private skuRepo: Repository<SKU>,
    @InjectRepository(SkuDiscount)
    private skuDiscountRepo: Repository<SkuDiscount>,
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
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'media')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .where('menuItem.restaurant_id IN (:...restaurantIds)', { restaurantIds })
      .andWhere('menuItem.is_active = :active', { active: 1 })
      .andWhere('sku.is_standard = :standard', { standard: 1 })
      .andWhere('sku.is_active = :active', { active: 1 })
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
    return foodList;
  }

  async getAvailableSkuDiscountBySkuId(skuId: number): Promise<SkuDiscount> {
    const now = new Date();
    const skuDiscount = await this.skuDiscountRepo.findOne({
      where: {
        sku_id: skuId,
        is_active: TRUE,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now),
      },
      order: {
        valid_from: 'DESC',
      },
    });
    return skuDiscount;
  }
  async getAvailableDiscountPrice(sku: SKU) {
    let discountPrice = sku.price;
    const skuDiscount = await this.getAvailableSkuDiscountBySkuId(sku.sku_id);
    if (!skuDiscount) {
      return discountPrice;
    }

    switch (skuDiscount.discount_unit_obj.symbol) {
      case PERCENTAGE:
        discountPrice = sku.price * (1 - skuDiscount.discount_value / 100);
        break;

      default: //VND, USD
        discountPrice = sku.price - skuDiscount.discount_value;
        break;
    }

    return discountPrice;
  }
}
