import { HttpException, Inject, Injectable } from '@nestjs/common';
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
import { MenuItemAttribute } from 'src/entity/menu-item-attribute.entity';
import { MenuItemAttributeValue } from 'src/entity/menu-item-attribute-value.entity';
import { NoAddingExt } from 'src/entity/no-adding-ext.entity';
import { SkuDetail } from 'src/entity/sku-detail.entity';
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
  } // end of getRestaurantExtension

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
  } // end of getReviewsByRestaurantId

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
  } // end of getAvailableSkuDiscountBySkuId

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
  } // end of getAvailableDiscountPrice

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
  } // end of convertIntoFoodDTO

  async interpretAdvanceTaseCustomization(
    obj_list: OptionSelection[],
    lang: string = 'vie',
  ): Promise<string> {
    let result = '';

    //if object is empty => return ''
    if (obj_list.length == 0) {
      result = '';
      return result;
    }

    const menuItemAttributeIds = obj_list.map((i) => i.option_id);
    const menuItemAttributes = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'menuItemAttribute')
      .leftJoinAndSelect('menuItemAttribute.taste_ext', 'taseExt')
      .where('menuItemAttribute.attribute_id IN (:...menuItemAttributeIds)', {
        menuItemAttributeIds,
      })
      .andWhere('menuItemAttribute.type_id = :type', { type: 'taste' })
      .andWhere('taseExt.ISO_language_code = :lang', { lang })
      .getMany();

    const menuItemAttributeValueIds = obj_list.map((i) => i.value_id);
    const menuItemAttributeValues = await this.entityManager
      .createQueryBuilder(MenuItemAttributeValue, 'attValue')
      .leftJoinAndSelect('attValue.taste_value_ext', 'ext')
      .where('attValue.value_id IN (:...menuItemAttributeValueIds)', {
        menuItemAttributeValueIds,
      })
      .andWhere('attValue.taste_value <> :tasteVal', { tasteVal: 'original' }) //dont generate note for original options
      .andWhere('ext.ISO_language_code = :lang', { lang })
      .getMany();

    const strArr = [];
    for (const option of obj_list) {
      let str = '';
      const menuItemAttribute = menuItemAttributes.find(
        (i) => i.attribute_id.toString() == option.option_id,
      );
      //check if the option_id has been filtered out
      if (!menuItemAttribute) {
        continue;
      }
      const menuItemAttributeValue = menuItemAttributeValues.find(
        (i) => i.value_id.toString() == option.value_id,
      );
      // check if the value_id has been filtered out
      if (!menuItemAttributeValue) {
        continue;
      }
      //check if the option_id and value_id is consistent - belong to the same attribute_id
      if (
        menuItemAttributeValue.attribute_id != menuItemAttribute.attribute_id
      ) {
        console.log(
          'menuItemAttributeValue ',
          menuItemAttributeValue.value_id,
          ' does not belong to menuItemAttribute ',
          menuItemAttribute.attribute_id,
        );
        continue;
      }
      str =
        menuItemAttributeValue.taste_value_ext[0].name +
        ' ' +
        menuItemAttribute.taste_ext[0].name;

      strArr.push(str);
    }
    result = strArr.join(' - ');

    return result;
  } // end of interpretAdvanceTaseCustomization

  async interpretBasicTaseCustomization(
    obj_list: BasicTasteSelection[],
    lang: string = 'vie',
  ): Promise<string> {
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
  } // end of interpretBasicTaseCustomization

  async interpretPortionCustomization(
    sku_id: number,
    lang: string = 'vie',
  ): Promise<string> {
    let result: string = '';

    const skuDetail = await this.entityManager
      .createQueryBuilder(SkuDetail, 'skuDetail')
      .leftJoinAndSelect('skuDetail.attribute_obj', 'attribute')
      .leftJoinAndSelect(
        'attribute.menu_item_attribute_ext_obj',
        'attributeExt',
      )
      .leftJoinAndSelect('skuDetail.value_obj', 'value')
      .leftJoinAndSelect('value.unit_obj', 'unit')
      .where('skuDetail.sku_id = :sku_id', { sku_id })
      .andWhere('attributeExt.ISO_language_code = :lang', { lang })
      .getMany();

    if (skuDetail.length == 0) {
      result = '';
      return result;
    }

    result = skuDetail
      .map((i) => {
        return (
          i.attribute_obj.menu_item_attribute_ext_obj[0].name +
          ' ' +
          i.value_obj.value +
          i.value_obj.unit_obj.symbol
        );
      })
      .join(' - ');

    return result;
  } // end of interpretPortionCustomization

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
  } // end of getBasicCustomizationByMenuItemId

  async getTasteCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemAttribute[]> {
    const data = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'attribute')
      .leftJoinAndSelect('attribute.values', 'values')
      .leftJoinAndSelect('attribute.taste_ext', 'tasteExt')
      .leftJoinAndSelect('values.taste_value_ext', 'tasteValueExt')
      .where('attribute.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere("attribute.type_id = 'taste'")
      .getMany();
    return data;
  } // end of getTasteCustomizationByMenuItemId

  async validateAdvacedTasteCustomizationObjWithMenuItem(
    obj_list: OptionSelection[],
    menu_item_id: number,
  ): Promise<ValidationResult> {
    // Check if the advanced_taste_customization_obj is all available to this menu item

    const result: ValidationResult = {
      isValid: true,
      message: null,
      data: null,
    };

    const avaibleAdvanceTasteCustomizationList = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'attribute')
      .leftJoinAndSelect('attribute.values', 'values')
      .where('attribute.menu_item_id = :menu_item_id', {
        menu_item_id,
      })
      .andWhere("attribute.type_id = 'taste'")
      .getMany();
    for (const obj of obj_list) {
      //find the attribute
      const attribute = avaibleAdvanceTasteCustomizationList.find(
        (i) => i.attribute_id.toString() == obj.option_id,
      );
      if (!attribute) {
        result.isValid = false;
        result.message = `Advanced Taste Customization: option_id ${obj.option_id} cannot be found`;
        break;
      }
      //check the value
      const value = attribute.values.find(
        (i) => i.value_id.toString() == obj.value_id,
      );
      if (!value) {
        result.isValid = false;
        result.message = `Advanced Taste Customization: value_id ${obj.value_id} is not availabe for option_id ${obj.option_id}`;
        break;
      }
    }

    return result;
  } // end of validateAdvacedTasteCustomizationObjWithMenuItem

  async validateBasicTasteCustomizationObjWithMenuItem(
    obj_list: BasicTasteSelection[],
    menu_item_id: number,
  ): Promise<ValidationResult> {
    // Check if the advanced_taste_customization_obj is all available to this menu item

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
  } // end of validateBasicTasteCustomizationObjWithMenuItem

  async checkIfSkuHasSameMenuItem(sku_ids: number[]): Promise<boolean> {
    const skuList = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .where('sku.sku_id IN (:...sku_ids)', { sku_ids })
      .getMany();

    if (skuList.length != sku_ids.length) {
      throw new HttpException(
        'There are some sku_id which does not exist',
        404,
      );
    }
    const menuItems = skuList.map((i) => i.menu_item_id);
    const uniqueMenuItems = [...new Set(menuItems)];
    if (uniqueMenuItems.length != 1) {
      return false;
    }
    return true;
  } // end of checkIfSkuHasSameMenuItem
}
