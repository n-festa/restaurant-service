import { HttpException, Inject, Injectable } from '@nestjs/common';
import {
  AdditionalInfoForSKU,
  BasicTasteSelection,
  Coordinate,
  DeliveryInfo,
  DeliveryRestaurant,
  OptionSelection,
  PriceUnitByMenuItem,
  RestaurantBasicInfo,
  Review,
  TextByLang,
  ThisDate,
  TimeRange,
  TimeSlot,
  ValidationResult,
} from 'src/type';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DAY_NAME, TRUE } from 'src/constant';
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
import { Restaurant } from 'src/entity/restaurant.entity';
import { DayId } from 'src/enum';
import { OperationHours } from 'src/entity/operation-hours.entity';
import { RestaurantDayOff } from 'src/entity/restaurant-day-off.entity';
import { ManualOpenRestaurant } from 'src/entity/manual-open-restaurant.entity';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { ConfigService } from '@nestjs/config';
import { Packaging } from 'src/entity/packaging.entity';
import { MenuItemPackaging } from 'src/entity/menuitem-packaging.entity';
import { ManualCutoffTime } from 'src/entity/manual-cutoff-time.entity';

@Injectable()
export class CommonService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly ahamoveService: AhamoveService,
    private readonly configService: ConfigService,
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

    let isAdvancedCustomizable: boolean = false;
    if (!!menuItem.attribute_obj) {
      if (
        menuItem.attribute_obj.filter((i) => i.type_id == 'taste').length > 0
      ) {
        isAdvancedCustomizable = true;
      }
    }
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
      preparing_time_s: menuItem.preparing_time_s,
      cooking_time_s: menuItem.cooking_time_s,
      quantity_available: menuItem.quantity_available,
      is_vegetarian: Boolean(menuItem.is_vegetarian),
      cooking_schedule: menuItem.cooking_schedule,
      units_sold: menuItem.units_sold,
      is_advanced_customizable: isAdvancedCustomizable,
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
      .leftJoinAndSelect('attValue.taste_value_obj', 'tasteObj')
      .leftJoinAndSelect('tasteObj.taste_value_ext', 'ext')
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
        continue;
      }
      str =
        menuItemAttributeValue.taste_value_obj.taste_value_ext[0].name +
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
      .leftJoinAndSelect('values.taste_value_obj', 'tasteValueObj')
      .leftJoinAndSelect('tasteValueObj.taste_value_ext', 'tasteValueExt')
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

  async getRestaurantBasicInfo(
    restaurant_id: number,
  ): Promise<RestaurantBasicInfo> {
    const result: RestaurantBasicInfo = {
      id: restaurant_id,
      name: [],
      logo_url: null,
    };

    const restaurant = await this.entityManager
      .createQueryBuilder(Restaurant, 'restaurant')
      .leftJoinAndSelect('restaurant.logo', 'logo')
      .leftJoinAndSelect('restaurant.restaurant_ext', 'ext')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
      .getOne();

    result.logo_url = restaurant.logo.url;
    for (const ext of restaurant.restaurant_ext) {
      const textByLang: TextByLang = {
        ISO_language_code: ext.ISO_language_code,
        text: ext.name,
      };
      result.name.push(textByLang);
    }
    return result;
  } // end of getRestaurantBasicInfo

  getRandomInteger(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } // end of getRandomInteger

  getThisDate(
    now: number,
    day_id: DayId,
    time_zone_offset_in_milliseconds: number,
  ): ThisDate {
    const today = new Date(now + time_zone_offset_in_milliseconds); // convert to local time
    const thisDate: ThisDate = {
      dayId: day_id,
      date: null,
    };
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = today.getUTCDay();
    // Calculate the difference to Saturday
    const daysToDayId = day_id - (dayOfWeek + 1);
    // Add the difference to today's date to get Saturday's date
    const date = new Date(today.getTime() + daysToDayId * 24 * 60 * 60 * 1000);
    thisDate.date = date.toISOString().split('T')[0]; // remove the time part of the date string

    return thisDate;
  } // end of getThisDate

  async getMenuItemByIds(ids: number[]): Promise<MenuItem[]> {
    const data = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .where('menuItem.menu_item_id IN (:...ids)', { ids })
      .getMany();
    return data;
  } // end of getMenuItemByIds

  convertTimeRangeToTimeSlot(
    time_range: TimeRange,
    // time_zone_offset_in_milliseconds: number,
    utc_offset: number = 7,
    time_step_m = 15, //in minutes
    mode = 0, //ceiling; 1: floor
  ): TimeSlot[] {
    const { from, to } = time_range;
    const timeSlots: TimeSlot[] = [];
    const timeStepInMiliseconds = time_step_m * 60 * 1000;
    const timeZoneOffsetInMilliseconds = utc_offset * 60 * 60 * 1000;

    let timestamp = 0;

    switch (mode) {
      case 0:
        timestamp =
          Math.ceil(
            (from + timeZoneOffsetInMilliseconds) / timeStepInMiliseconds,
          ) * timeStepInMiliseconds;
        break;

      case 1:
        timestamp =
          Math.floor(
            (from + timeZoneOffsetInMilliseconds) / timeStepInMiliseconds,
          ) * timeStepInMiliseconds;
        break;

      default:
        throw new HttpException('wrong mode value', 500);
    }

    while (timestamp <= to + timeZoneOffsetInMilliseconds) {
      const loopDate = new Date(timestamp);
      const timeSlot: TimeSlot = {
        dayId: loopDate.getUTCDay() + 1, // 1->7: Sunday -> Saturday
        dayName: DAY_NAME[loopDate.getUTCDay()], //sun,mon,tue,wed,thu,fri,sat
        date: loopDate.toISOString().split('T')[0],
        hours: loopDate.getUTCHours().toString().padStart(2, '0'),
        minutes: loopDate.getUTCMinutes().toString().padStart(2, '0'),
        utc_offset: utc_offset,
      };
      timeSlots.push(timeSlot);
      timestamp += timeStepInMiliseconds; // add 15 minutes to the timestamp for each iteration
    }

    return timeSlots;
  } // end of convertTimeRangeToTimeSlot

  async getRestaurantOperationHours(
    restaurant_id: number,
  ): Promise<OperationHours[]> {
    const opsHours = await this.entityManager
      .createQueryBuilder(OperationHours, 'ops')
      .where('ops.restaurant_id = :restaurant_id', { restaurant_id })
      .getMany();
    return opsHours;
  } // end of getRestaurantOperationHours

  async getUtcTimeZone(restaurant_id: number): Promise<number> {
    return Number(
      (
        await this.entityManager
          .createQueryBuilder(Restaurant, 'res')
          .where('res.restaurant_id = :restaurant_id', { restaurant_id })
          .select(['res.utc_time_zone'])
          .getOne()
      ).utc_time_zone,
    );
  } // end of getUtcTimeZone

  async getAvailableRestaurantDayOff(
    restaurant_id: number,
    now: number,
  ): Promise<RestaurantDayOff[]> {
    const restaurantUtcTimeZone = await this.getUtcTimeZone(restaurant_id);
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST
    const todayStr = new Date(now + timeZoneOffset).toISOString().split('T')[0];
    const query = `SELECT * FROM Restaurant_Day_Off where date >= date("${todayStr}")`;
    const data = await this.entityManager.query(query);
    return data; // Return the array of RestaurantDayOff objects
  } // end of getAvailableRestaurantDayOff

  convertTimeToSeconds(
    time: string, //format hh:mm:ss
  ): number {
    const timeRegex = new RegExp(/^\d{2}:\d{2}:\d{2}$/);
    if (!timeRegex.test(time)) {
      throw new HttpException('Invalid time format hh:mm:ss', 400); // Throw an HTTP exception with status code 400 for invalid time format
    }
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  } // end of convertTimeToSeconds

  convertSecondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } // end of convertSecondsToTime

  async getTodayOpsTime(
    restaurant_id: number,
    now: number,
  ): Promise<TimeRange | null> {
    const timeRange: TimeRange = {
      from: null,
      to: null,
    };
    const restaurantUtcTimeZone = await this.getUtcTimeZone(restaurant_id);
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST

    //Get latest manual open data
    const query = `SELECT * FROM Manual_Open_Restaurant where date = date(FROM_UNIXTIME(${
      (now + timeZoneOffset) / 1000
    })) ORDER BY created_at DESC LIMIT 0,1`;
    const data: ManualOpenRestaurant[] = await this.entityManager.query(query);

    if (data.length <= 0) {
      //No manual open data => Get the day off data from the table Restaurant_Day_Off

      const todayStr = new Date(now + timeZoneOffset)
        .toISOString()
        .split('T')[0];
      const query = `SELECT * FROM Restaurant_Day_Off where date = date("${todayStr}")`;
      const dayOffs: RestaurantDayOff[] = await this.entityManager.query(query);

      if (dayOffs.length > 0) {
        //Today is the day off => return no data
        return null;
      }

      //Get the operation hours of the restaurant for today
      const todayOpsHours = (
        await this.getRestaurantOperationHours(restaurant_id)
      ).filter(
        (i) => i.day_of_week == new Date(now + timeZoneOffset).getUTCDay() + 1,
      );
      const [fromHours, fromMinutes, fromSeconds] = todayOpsHours[0].from_time
        .split(':')
        .map((i) => parseInt(i));
      const [toHours, toMinutes, toSeconds] = todayOpsHours[0].to_time
        .split(':')
        .map((i) => parseInt(i));
      timeRange.from =
        new Date(now + timeZoneOffset).setUTCHours(
          fromHours,
          fromMinutes,
          fromSeconds,
        ) - timeZoneOffset;
      timeRange.to =
        new Date(now + timeZoneOffset).setUTCHours(
          toHours,
          toMinutes,
          toSeconds,
        ) - timeZoneOffset;
      return timeRange;
    }

    // Existing manual open data
    timeRange.from = new Date(data[0].from_time).getTime();
    timeRange.to = new Date(data[0].to_time).getTime();

    return timeRange;
  } // end of getTodayOpsTime

  getOverlappingTimeRange(
    timeRange1: TimeRange,
    timeRange2: TimeRange,
  ): TimeRange | null {
    const from = Math.max(timeRange1.from, timeRange2.from);
    const to = Math.min(timeRange1.to, timeRange2.to);
    if (from <= to) {
      return { from, to };
    }
    return null; // No overlapping time range.
  } // end of getOverlappingTimeRange

  async estimateTimeAndDistanceForRestaurant(
    restaurant_id: number,
    user_long: number,
    user_lat: number,
  ): Promise<DeliveryInfo> {
    const restaurant = await this.entityManager
      .createQueryBuilder(Restaurant, 'restaurant')
      .leftJoinAndSelect('restaurant.address', 'address')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
      .getOne();
    const userLocation: Coordinate = {
      lat: user_lat,
      long: user_long,
    };

    const restaurantLocation: Coordinate = {
      lat: restaurant.address.latitude,
      long: restaurant.address.longitude,
    };
    return await this.ahamoveService.estimateTimeAndDistance(
      restaurantLocation,
      userLocation,
    );
  } // end of estimateTimeAndDistanceForRestaurant

  async getAdditionalInfoForSkus(
    sku_ids: number[],
  ): Promise<AdditionalInfoForSKU[]> {
    if (sku_ids.length <= 0) {
      return [];
    }
    const data: AdditionalInfoForSKU[] = [];
    const skus = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.menu_item', 'menuItem')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'media')
      .where('sku.sku_id IN (:...sku_ids)', { sku_ids })
      .getMany();
    const menuItemIds = skus.map((i) => i.menu_item_id);
    const uniquemenuItemIds = menuItemIds.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    const priceUnits = await this.getPriceUnitByMenuItems(uniquemenuItemIds);
    for (const item of skus) {
      const priceUnit = priceUnits.find(
        (i) => i.menu_item_id == item.menu_item_id,
      );
      const additionalInfoForSKU: AdditionalInfoForSKU = {
        sku_id: item.sku_id,
        sku_name: item.menu_item.menuItemExt.map((i) => {
          return {
            ISO_language_code: i.ISO_language_code,
            text: i.name,
          };
        }),
        sku_img: item.menu_item.image_obj.url,
        sku_price: item.price,
        sku_price_after_discount: await this.getAvailableDiscountPrice(item),
        sku_unit: priceUnit?.price_unit || null,
      };
      data.push(additionalInfoForSKU);
    }
    return data;
  } //end of getAdditionalInfoForSkus

  async getPriceUnitByMenuItems(
    menu_item_ids: number[],
  ): Promise<PriceUnitByMenuItem[]> {
    const data: PriceUnitByMenuItem[] = [];
    const menuItems = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .leftJoinAndSelect('menuItem.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.unit_obj', 'unit')
      .where('menuItem.menu_item_id IN (:...menu_item_ids)', { menu_item_ids })
      .getMany();

    for (const item of menuItems) {
      const priceUnitByMenuItem: PriceUnitByMenuItem = {
        menu_item_id: item.menu_item_id,
        price_unit: item.restaurant.unit_obj.symbol,
      };
      data.push(priceUnitByMenuItem);
    }

    return data;
  } // end of getPriceUnitByMenuItems

  validateEmail(email: string): boolean {
    const emailRegex = new RegExp(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    );
    return emailRegex.test(email);
  } // end of validateEmail

  async getStandardSkuByMenuItem(menu_item_id: number): Promise<SKU> {
    if (!menu_item_id) {
      return null;
    }
    const sku = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .where('sku.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere('sku.is_standard = 1')
      .andWhere('sku.is_active = 1')
      .getOne();
    return sku;
  } // end of getStandardSkuByMenuItem

  async getPlanningDate(
    restaurant_id: number,
    now_timestamp: number,
  ): Promise<number> {
    const restaurantUtcTimeZone = await this.getUtcTimeZone(restaurant_id);
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST
    const adjustedNowTimestamp = now_timestamp + timeZoneOffset;
    const adjustedNow = new Date(adjustedNowTimestamp);

    //Get the planning day from the config
    const planningDay = this.configService.get<number>('planningDay');
    // Calculate the number of days to add to get to Planning Date
    const daysToPlanningDay = planningDay - (adjustedNow.getUTCDay() + 1);

    // Set the planning date
    const planningDate = new Date(
      adjustedNowTimestamp + daysToPlanningDay * 24 * 60 * 60 * 1000,
    );
    // Set the time to 23:59:59:999 (UTC timezone)
    const planningDateTmestamp = planningDate.setUTCHours(23, 59, 59, 999);

    //return data after adjusting with time offset
    return planningDateTmestamp - timeZoneOffset;
  } // end of getPlanningDate

  async getStandardPackagingByMenuItem(
    menu_item_id: number,
  ): Promise<Packaging> {
    const menuItemPackaging = await this.entityManager
      .createQueryBuilder(MenuItemPackaging, 'menuItemPackaging')
      .where('menuItemPackaging.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere('menuItemPackaging.is_default = 1')
      .getOne();
    if (!menuItemPackaging) {
      return null;
    }
    return await this.entityManager
      .createQueryBuilder(Packaging, 'packaging')
      .where('packaging.packaging_id = :packaging_id', {
        packaging_id: menuItemPackaging.packaging_id,
      })
      .getOne();
  } //end of getStandardPackagingByMenuItem

  async checkIfFoodIsAdvancedCustomizable(
    menu_item_id: number,
  ): Promise<boolean> {
    let resutl: boolean = false;

    const advancedCustomization = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'attribute')
      .where('attribute.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere("attribute.type_id = 'taste'")
      .getMany();

    resutl = advancedCustomization.length > 0 ? true : false;
    return resutl;
  } //end of checkIfFoodIsAdvancedCustomizable

  async getRestaurantById(restaurant_id: number): Promise<Restaurant> {
    const restaurant = await this.entityManager
      .createQueryBuilder(Restaurant, 'restaurant')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
      .getOne();
    return restaurant;
  } //end of getRestaurantById

  async checkIfRestaurantHasAdvancedCustomizableFood(
    restaurant_id: number,
  ): Promise<boolean> {
    let resutl: boolean = false;

    const advancedCustomization = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'attribute')
      .leftJoinAndSelect('attribute.menu_item_obj', 'menuItem')
      .where('menuItem.restaurant_id = :restaurant_id', { restaurant_id })
      .andWhere("attribute.type_id = 'taste'")
      .getMany();

    resutl = advancedCustomization.length > 0 ? true : false;
    return resutl;
  } //end of checkIfFoodIsAdvancedCustomizable

  async getCutoffTimePoint(
    now: number,
    restaurant_id: number,
  ): Promise<number> {
    const restaurantUtcTimeZone = await this.getUtcTimeZone(restaurant_id);
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST

    let cutoffTimeConfig: number = 0;
    //get MANUAL cutoff time config from Manual_Cutoff_Time
    const query = `SELECT * FROM Manual_Cutoff_Time where date = date(FROM_UNIXTIME(${
      (now + timeZoneOffset) / 1000
    })) ORDER BY logged_at DESC LIMIT 0,1`;
    const data: ManualCutoffTime[] = await this.entityManager.query(query);
    if (data.length > 0) {
      cutoffTimeConfig = data[0].cutoff_time_m;
    } else if (data.length <= 0) {
      //get cutoff time config from restaurant
      const restaurant = await this.getRestaurantById(restaurant_id);
      cutoffTimeConfig = restaurant.cutoff_time_m;
    }

    //Get starting point for local today
    const localToday = new Date(now + timeZoneOffset);
    localToday.setUTCHours(0, 0, 0, 0);
    const startingPointOfLocalToday = localToday.getTime() - timeZoneOffset;

    //return data after adjusting with time offset and cutoff time config
    return startingPointOfLocalToday + cutoffTimeConfig * 60 * 1000;
  }
}
