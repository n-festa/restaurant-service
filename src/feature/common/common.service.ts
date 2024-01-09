import { Inject, Injectable } from '@nestjs/common';
import {
  BasicTasteSelection,
  DeliveryRestaurant,
  OptionSelection,
  Review,
  TextByLang,
  ValidationResult,
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
import { MenuItemVariantOpion } from 'src/entity/menu-item-variant-option.entity';
import { NoAddingExt } from 'src/entity/no-adding-ext.entity';
import { SkuMenuItemVariant } from 'src/entity/sku-menu-item-variant.entity';
import { BasicCustomization } from 'src/entity/basic-customization.entity';

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
      result = strArr.join(' - ');

      return result;
    }
  }

  async interpretBasicTaseCustomization(
    obj_list: BasicTasteSelection[],
    lang: string = 'vie',
  ): Promise<string> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      let result: string = '';

      //if object is empty => return ''
      if (obj_list.length == 0) {
        result = '';
        return result;
      }

      //get unique no_adding_id from obj_list
      const uniqueNoAddingIds = obj_list
        .map((i) => i.no_adding_id)
        .filter((value, index, self) => {
          return self.indexOf(value) === index;
        });

      result = (
        await this.entityManager
          .createQueryBuilder(NoAddingExt, 'ext')
          .where('ext.no_adding_id IN (:...uniqueNoAddingIds)', {
            uniqueNoAddingIds,
          })
          .andWhere('ext.ISO_language_code = :lang', { lang })
          .getMany()
      )
        .map((i) => i.description)
        .join(' - ');

      return result;
    }
  }

  async interpretPortionCustomization(
    sku_id: number,
    lang: string = 'vie',
  ): Promise<string> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      let result: string = '';

      const variants = await this.entityManager
        .createQueryBuilder(SkuMenuItemVariant, 'variant')
        .leftJoinAndSelect('variant.attribute', 'attribute')
        .leftJoinAndSelect(
          'attribute.menu_item_variant_ext_obj',
          'attributeExt',
        )
        .leftJoinAndSelect('variant.value', 'value')
        .leftJoinAndSelect('value.unit_obj', 'unit')
        .where('variant.sku_id = :sku_id', { sku_id })
        .andWhere('attributeExt.ISO_language_code = :lang', { lang })
        .getMany();

      if (variants.length == 0) {
        result = '';
        return result;
      }

      result = variants
        .map((i) => {
          return (
            i.attribute.menu_item_variant_ext_obj[0].name +
            ' ' +
            i.value.value +
            i.value.unit_obj.symbol
          );
        })
        .join(' - ');

      return result;
    }
  }

  async getBasicCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<BasicCustomization[]> {
    const data = await this.entityManager
      .createQueryBuilder(BasicCustomization, 'basicCustomization')
      .leftJoinAndSelect('basicCustomization.extension', 'ext')
      .where('basicCustomization.menu_item_id = :menu_item_id', {
        menu_item_id,
      })
      .getMany();
    return data;
  }
  async getTasteCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemVariant[]> {
    const data = await this.entityManager
      .createQueryBuilder(MenuItemVariant, 'variant')
      .leftJoinAndSelect('variant.options', 'options')
      .leftJoinAndSelect('variant.taste_ext', 'tasteExt')
      .leftJoinAndSelect('options.taste_value_ext', 'tasteValueExt')
      .where('variant.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere("variant.type = 'taste'")
      .getMany();
    return data;
  }

  async validateAdvacedTasteCustomizationObjWithMenuItem(
    obj_list: OptionSelection[],
    menu_item_id: number,
  ): Promise<ValidationResult> {
    // Check if the advanced_taste_customization_obj is all available to this menu item
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      const result: ValidationResult = {
        isValid: true,
        message: null,
        data: null,
      };

      const avaibleAdvanceTasteCustomizationList = await this.entityManager
        .createQueryBuilder(MenuItemVariant, 'variant')
        .leftJoinAndSelect('variant.options', 'options')
        .where('variant.menu_item_id = :menu_item_id', {
          menu_item_id,
        })
        .andWhere("variant.type = 'taste'")
        .getMany();
      for (const obj of obj_list) {
        //find the attribute
        const attribute = avaibleAdvanceTasteCustomizationList.find(
          (i) => i.menu_item_variant_id.toString() == obj.option_id,
        );
        if (!attribute) {
          result.isValid = false;
          result.message = `Advanced Taste Customization: option_id ${obj.option_id} cannot be found`;
          break;
        }
        //check the value
        const value = attribute.options.find(
          (i) => i.menu_item_variant_option_id.toString() == obj.value_id,
        );
        if (!value) {
          result.isValid = false;
          result.message = `Advanced Taste Customization: value_id ${obj.value_id} is not availabe for option_id ${obj.option_id}`;
          break;
        }
      }

      return result;
    }
  }

  async validateBasicTasteCustomizationObjWithMenuItem(
    obj_list: BasicTasteSelection[],
    menu_item_id: number,
  ): Promise<ValidationResult> {
    // Check if the advanced_taste_customization_obj is all available to this menu item
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      const result: ValidationResult = {
        isValid: true,
        message: null,
        data: null,
      };

      const avaibleBasicTasteCustomizationList = await this.entityManager
        .createQueryBuilder(BasicCustomization, 'basicCustomization')
        .where('basicCustomization.menu_item_id = :menu_item_id', {
          menu_item_id,
        })
        .getMany();
      for (const obj of obj_list) {
        //find the attribute
        const noAddingId = avaibleBasicTasteCustomizationList.find(
          (i) => i.no_adding_id == obj.no_adding_id,
        );
        if (!noAddingId) {
          result.isValid = false;
          result.message = `Basic Taste Customization: no_adding_id ${obj.no_adding_id} cannot be found`;
          break;
        }
      }

      return result;
    }
  }
}
