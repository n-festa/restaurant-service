import { Inject, Injectable } from '@nestjs/common';
import {
  DeliveryRestaurant,
  OptionSelection,
  Review,
  TextByLang,
} from 'src/type';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { TRUE } from 'src/constant';
import { FoodRating } from 'src/entity/food-rating.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { SKU } from 'src/entity/sku.entity';
import { PERCENTAGE } from 'src/constant/unit.constant';
import { MenuItem } from 'src/entity/menu-item.entity';
import { FoodDTO } from 'src/dto/food.dto';
import { MenuItemVariant } from 'src/entity/menu-item-variant.entity';
import { TasteExt } from 'src/entity/taste-ext.entity';
import { resourceUsage } from 'process';
import { MenuItemVariantOpion } from 'src/entity/menu-item-variant-option.entity';

@Injectable()
export class CommonService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async getRestaurantExtension(id: number): Promise<RestaurantExt[]> {
    return await this.entityManager
      .createQueryBuilder(RestaurantExt, 'resExt')
      .where('resExt.restaurant_id = :id', { id })
      .getMany();
  }

  async getReviewsByRestaurantId(
    restaurant_id: number,
    limit: number,
    order: 'ASC' | 'DESC',
  ): Promise<Review[]> {
    const reviews: Review[] = [];
    const data = await this.entityManager
      .createQueryBuilder(FoodRating, 'foodRating')
      .leftJoin('foodRating.order_sku_obj', 'orderSKU')
      .leftJoin('orderSKU.sku_obj', 'sku')
      .leftJoin('sku.menu_item', 'menuItem')
      .where('menuItem.restaurant_id = :restaurant_id', { restaurant_id })
      .andWhere('foodRating.is_active = :active', { active: TRUE })
      .select([
        'foodRating.food_rating_id',
        'foodRating.score',
        'foodRating.remarks',
      ])
      .limit(limit)
      .offset(0)
      .orderBy('foodRating.created_at', order)
      .getMany();
    for (const item of data) {
      const review: Review = {
        food_rating_id: item.food_rating_id,
        score: item.score,
        remarks: item.remarks,
      };
      reviews.push(review);
    }

    return reviews;
  }

  async getAvailableSkuDiscountBySkuId(skuId: number): Promise<SkuDiscount> {
    const now = new Date();
    const skuDiscount = await this.entityManager
      .getRepository(SkuDiscount)
      .findOne({
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
    correspondingRestaurant: DeliveryRestaurant = null,
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
      correspondingRestaurant?.restaurant_ext.map((ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
      }) || null;

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
      distance_km: correspondingRestaurant?.distance_km || null,
      delivery_time_s: correspondingRestaurant?.delivery_time_s || null,
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

  async interpretAdvanceTaseCustomization(
    obj_list: OptionSelection[],
    lang: string = 'vie',
  ): Promise<string> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      let result = '';

      //if object is empty => return ''
      if (obj_list.length == 0) {
        result = '';
        return result;
      }

      const menuItemVariantIds = obj_list.map((i) => i.option_id);
      const menuItemVariants = await this.entityManager
        .createQueryBuilder(MenuItemVariant, 'menuItemVariant')
        .leftJoinAndSelect('menuItemVariant.taste_ext', 'taseExt')
        .where(
          'menuItemVariant.menu_item_variant_id IN (:...menuItemVariantIds)',
          { menuItemVariantIds },
        )
        .andWhere('menuItemVariant.type = :type', { type: 'taste' })
        .andWhere('taseExt.ISO_language_code = :lang', { lang })
        .getMany();

      const menuItemVariantOptionIds = obj_list.map((i) => i.value_id);
      const menuItemVariantOptions = await this.entityManager
        .createQueryBuilder(MenuItemVariantOpion, 'option')
        .leftJoinAndSelect('option.taste_value_ext', 'ext')
        .where(
          'option.menu_item_variant_option_id IN (:...menuItemVariantOptionIds)',
          { menuItemVariantOptionIds },
        )
        .andWhere('option.taste_value <> :tasteVal', { tasteVal: 'original' }) //dont generate note for original options
        .andWhere('ext.ISO_language_code = :lang', { lang })
        .getMany();

      const strArr = [];
      for (const option of obj_list) {
        let str = '';
        const menuItemVariant = menuItemVariants.find(
          (i) => i.menu_item_variant_id.toString() == option.option_id,
        );
        //check if the option_id has been filtered out
        if (!menuItemVariant) {
          continue;
        }
        const menuItemVariantOption = menuItemVariantOptions.find(
          (i) => i.menu_item_variant_option_id.toString() == option.value_id,
        );
        // check if the value_id has been filtered out
        if (!menuItemVariantOption) {
          continue;
        }
        //check if the option_id and value_id is consistent - belong to the same menu_item_variant_id
        if (
          menuItemVariantOption.menu_item_variant_id !=
          menuItemVariant.menu_item_variant_id
        ) {
          console.log(
            'menuItemVariantOption ',
            menuItemVariantOption.menu_item_variant_option_id,
            ' does not belong to menuItemVariant ',
            menuItemVariant.menu_item_variant_id,
          );
          continue;
        }
        str =
          menuItemVariantOption.taste_value_ext[0].name +
          ' ' +
          menuItemVariant.taste_ext[0].name;

        strArr.push(str);
      }
      console.log('strArr', strArr);
      result = strArr.join(' - ');

      return result;
    }
  }
}
