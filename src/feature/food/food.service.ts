import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { DeliveryRestaurant, PriceRange, TextByLang } from 'src/type';
import { SKU } from 'src/entity/sku.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { PERCENTAGE } from 'src/constant/unit.constant';
import { FALSE, TRUE } from 'src/constant';
import { FoodDTO } from '../../dto/food.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';

@Injectable()
export class FoodService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(SKU) private skuRepo: Repository<SKU>,
    @InjectRepository(SkuDiscount)
    private skuDiscountRepo: Repository<SkuDiscount>,
  ) {}

  async getPriceRangeByMenuItem(menuItemList: number[]): Promise<PriceRange> {
    if (this.flagService.isFeatureEnabled('fes-12-search-food-by-name')) {
      //Get the before-discount price for only standard SKUs
      let query =
        'SELECT min(sku.price) as min, max(sku.price) as max FROM SKU as sku where sku.menu_item_id IN (' +
        menuItemList.join(',') +
        ') and sku.is_standard = 1';
      const rawData = await this.menuItemRepo.query(query);
      const range: PriceRange = {
        min: rawData[0].min,
        max: rawData[0].max,
      };
      return range;
    } else {
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
  }

  async getFoodsWithListOfRestaurants(restaurantIds: number[]) {
    const foodList = await this.menuItemRepo
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'media')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .where('menuItem.restaurant_id IN (:...restaurantIds)', { restaurantIds })
      .andWhere('menuItem.is_active = :active', { active: TRUE })
      .andWhere('sku.is_standard = :standard', { standard: TRUE })
      .andWhere('sku.is_active = :active', { active: TRUE })
      .getMany();
    return foodList;
  }

  async getFoodsWithListOfMenuItem(
    menuItems: number[],
    langs: string[] = [],
    withSKU: number = TRUE,
  ) {
    if (
      this.flagService.isFeatureEnabled('fes-12-search-food-by-name') ||
      this.flagService.isFeatureEnabled('fes-15-get-food-detail')
    ) {
      if (!menuItems || menuItems.length === 0) {
        return [];
      }
      let foodList: MenuItem[];
      if (withSKU == TRUE) {
        if (langs.length === 0) {
          foodList = await this.menuItemRepo
            .createQueryBuilder('menuItem')
            .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
            .leftJoinAndSelect('menuItem.image_obj', 'media')
            .leftJoinAndSelect('menuItem.skus', 'sku')
            .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
            .andWhere('menuItem.is_active = :active', { active: TRUE })
            .andWhere('sku.is_standard = :standard', {
              standard: TRUE,
            })
            .andWhere('sku.is_active = :active', { active: TRUE })
            .getMany();
        } else if (langs.length > 0) {
          foodList = await this.menuItemRepo
            .createQueryBuilder('menuItem')
            .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
            .leftJoinAndSelect('menuItem.image_obj', 'media')
            .leftJoinAndSelect('menuItem.skus', 'sku')
            .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
            .andWhere('menuItem.is_active = :active', { active: TRUE })
            .andWhere('sku.is_standard = :standard', {
              standard: TRUE,
            })
            .andWhere('sku.is_active = :active', { active: TRUE })
            .andWhere('menuItemExt.ISO_language_code IN (:...langs)', { langs })
            .getMany();
        }
      } else if (withSKU == FALSE) {
        if (langs.length === 0) {
          foodList = await this.menuItemRepo
            .createQueryBuilder('menuItem')
            .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
            .leftJoinAndSelect('menuItem.image_obj', 'media')
            .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
            .andWhere('menuItem.is_active = :active', { active: TRUE })
            .getMany();
        } else if (langs.length > 0) {
          foodList = await this.menuItemRepo
            .createQueryBuilder('menuItem')
            .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
            .leftJoinAndSelect('menuItem.image_obj', 'media')
            .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
            .andWhere('menuItem.is_active = :active', { active: TRUE })
            .andWhere('menuItemExt.ISO_language_code IN (:...langs)', { langs })
            .getMany();
        }
      }

      return foodList;
    } else {
      if (!menuItems || menuItems.length === 0) {
        return [];
      }
      const foodList = await this.menuItemRepo
        .createQueryBuilder('menuItem')
        .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
        .leftJoinAndSelect('menuItem.image_obj', 'media')
        .leftJoinAndSelect('menuItem.skus', 'sku')
        .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
        .andWhere('menuItem.is_active = :active', { active: TRUE })
        .andWhere('sku.is_standard = :standard', { standard: TRUE })
        .andWhere('sku.is_active = :active', { active: TRUE })
        .getMany();
      return foodList;
    }
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

  async convertIntoFoodDTO(
    menuItem: MenuItem,
    correspondingRestaurant: DeliveryRestaurant,
  ): Promise<FoodDTO> {
    //Defind Logic of Top Label later, currently just present the vegeterian sign
    let topLabel = '';
    if (Boolean(menuItem.is_vegetarian)) {
      topLabel = 'CHAY';
    }

    const foodNameByLang: TextByLang[] = menuItem.menuItemExt.map((ext) => {
      return {
        ISO_language_code: ext.ISO_language_code,
        text: ext.short_name,
      };
    });

    const mainCookingMethodByLang: TextByLang[] = menuItem.menuItemExt.map(
      (ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.main_cooking_method,
        };
      },
    );

    const restaurantNameByLang: TextByLang[] =
      correspondingRestaurant.restaurant_ext.map((ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
      });

    return {
      id: menuItem.menu_item_id,
      image: menuItem.image_obj.url,
      top_label: topLabel,
      bottom_label: null,
      name: foodNameByLang,
      restaurant_name: restaurantNameByLang,
      restaurant_id: menuItem.restaurant_id,
      calorie_kcal: menuItem.skus[0].calorie_kcal,
      rating: menuItem.rating,
      distance_km: correspondingRestaurant.distance_km,
      delivery_time_s: correspondingRestaurant.delivery_time_s,
      main_cooking_method: mainCookingMethodByLang,
      ingredient_brief_vie: menuItem.ingredient_brief_vie,
      ingredient_brief_eng: menuItem.ingredient_brief_eng,
      price: menuItem.skus[0].price,
      price_after_discount: await this.getAvailableDiscountPrice(
        menuItem.skus[0],
      ),
      promotion: menuItem.promotion,
      cutoff_time: menuItem.cutoff_time,
      preparing_time_s: menuItem.preparing_time_s,
      cooking_time_s: menuItem.cooking_time_s,
      quantity_available: menuItem.quantity_available,
      is_vegetarian: Boolean(menuItem.is_vegetarian),
      cooking_schedule: menuItem.cooking_schedule,
      units_sold: menuItem.units_sold,
    };
  }

  async getFoodDetailById(id: number) {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      let result = new GeneralResponse(200, '');
      //Get basic food data
      const foods = await this.getFoodsWithListOfMenuItem([id], [], FALSE);

      if (foods.length === 0) {
        result.statusCode = 404;
        result.message = 'Food not found';
        return result;
      }

      result.statusCode = 200;
      result.message = 'Getting Food Detail Successfully';
      result.data = foods;
      return result;

      //Get list of images
    } else {
    }
  }
}
