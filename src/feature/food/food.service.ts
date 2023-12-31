import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  DayShift,
  Option,
  OptionValue,
  PriceRange,
  RatingStatistic,
  Review,
  TextByLang,
} from 'src/type';
import { SKU } from 'src/entity/sku.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { FALSE, TRUE } from 'src/constant';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { FoodRating } from 'src/entity/food-rating.entity';
import { Media } from 'src/entity/media.entity';
import { Packaging } from 'src/entity/packaging.entity';
import { Recipe } from 'src/entity/recipe.entity';
import { MenuItemVariant } from 'src/entity/menu-item-variant.entity';
import { SkuDTO } from 'src/dto/sku.dto';
import { Unit } from 'src/entity/unit.entity';
import { Restaurant } from 'src/entity/restaurant.entity';
import { BasicCustomization } from 'src/entity/basic-customization.entity';
import { CommonService } from '../common/common.service';
import { GetSideDishRequest } from './dto/get-side-dish-request.dto';
import { GetSideDishResonse } from './dto/get-side-dish-response.dto';
import { MainSideDish } from 'src/entity/main-side-dish.entity';
import { Day, Shift } from 'src/enum';
import { FoodDTO } from 'src/dto/food.dto';

@Injectable()
export class FoodService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(SKU) private skuRepo: Repository<SKU>,
    @InjectEntityManager() private entityManager: EntityManager,
    @InjectRepository(SkuDiscount)
    private skuDiscountRepo: Repository<SkuDiscount>,
    private readonly commonService: CommonService,
  ) {}

  async getPriceRangeByMenuItem(menuItemList: number[]): Promise<PriceRange> {
    //Get the before-discount price for only standard SKUs
    const query =
      'SELECT min(sku.price) as min, max(sku.price) as max FROM SKU as sku where sku.menu_item_id IN (' +
      menuItemList.join(',') +
      ') and sku.is_standard = 1';
    const rawData = await this.menuItemRepo.query(query);
    const range: PriceRange = {
      min: rawData[0].min,
      max: rawData[0].max,
    };
    return range;
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
  }

  async getFoodDetailByMenuItemId(
    menuItemId: number,
  ): Promise<GeneralResponse> {
    const result = new GeneralResponse(200, '');
    //Get basic food data
    const foods = await this.getFoodsWithListOfMenuItem(
      [menuItemId],
      [],
      FALSE,
    );
    if (foods.length === 0) {
      result.statusCode = 404;
      result.message = 'Food not found';
      return result;
    }
    const restaurantExt = await this.commonService.getRestaurantExtension(
      foods[0].restaurant_id,
    );

    //Get rating data
    const reviews = await this.getReviewByMenuItemId(menuItemId);
    const ratingStatistic =
      await this.getRatingStatisticByMenuItemId(menuItemId);

    //Get images
    const medias = await this.getAllMediaByMenuItemId(menuItemId);

    //Get packaging information
    const packaging = await this.getPackagingByMenuItemId(menuItemId);

    //Get recipe information
    const recipe = await this.getRecipeByMenuItemId(menuItemId);

    //Get portion customization
    const portionCustomization =
      await this.getPortionCustomizationByMenuItemId(menuItemId);
    const convertedPortionCustomization =
      await this.convertPortionCustomization(portionCustomization);

    //Get taste customization
    const tasteCustomization =
      await this.commonService.getTasteCustomizationByMenuItemId(menuItemId);
    const convertedTasteCustomization =
      await this.convertTasteCustomization(tasteCustomization);

    //Get basic customization
    const basicCustomization =
      await this.commonService.getBasicCustomizationByMenuItemId(menuItemId);
    const convertedBasicCustomization = [];
    for (const basic of basicCustomization) {
      const customizedItem = {
        no_adding_id: basic.no_adding_id,
        description: basic.extension.map((ext) => {
          return {
            ISO_language_code: ext.ISO_language_code,
            text: ext.description,
          };
        }),
      };
      convertedBasicCustomization.push(customizedItem);
    }

    //Mapping data to the result
    const data = {
      menu_item_id: menuItemId,
      images: medias.map((media) => media.url),
      name: foods[0].menuItemExt.map((ext) => {
        return { ISO_language_code: ext.ISO_language_code, text: ext.name };
      }),
      restaurant_name: restaurantExt.map((ext) => {
        return { ISO_language_code: ext.ISO_language_code, text: ext.name };
      }),
      restaurant_id: foods[0].restaurant_id,
      available_quantity: foods[0].quantity_available,
      units_sold: foods[0].units_sold,
      review_number: ratingStatistic.total_count,
      promotion: foods[0].promotion,
      packaging_info: await this.generatePackageSentenceByLang(packaging),
      cutoff_time: foods[0].cutoff_time,
      ingredients: recipe.map((item) => {
        return {
          item_name_vie: item.ingredient.vie_name,
          item_name_eng: item.ingredient.eng_name,
          quantity: item.quantity,
          unit: item.unit_obj.symbol,
        };
      }),
      description: foods[0].menuItemExt.map((ext) => {
        return {
          ISO_language_code: ext.ISO_language_code,
          text: ext.description,
        };
      }),
      portion_customization: convertedPortionCustomization,
      taste_customization: convertedTasteCustomization,
      other_customizaton: convertedBasicCustomization,
      reviews: reviews,
    };

    result.statusCode = 200;
    result.message = 'Getting Food Detail Successfully';
    result.data = data;
    return result;
  }

  async getReviewByMenuItemId(menu_item_id: number): Promise<Review[]> {
    const reviews: Review[] = [];
    const data = await this.entityManager
      .createQueryBuilder(FoodRating, 'foodRating')
      .leftJoin('foodRating.order_sku_obj', 'orderSKU')
      .leftJoin('orderSKU.sku_obj', 'sku')
      .leftJoin('sku.menu_item', 'menuItem')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere('foodRating.is_active = :active', { active: TRUE })
      .select([
        'foodRating.food_rating_id',
        'foodRating.score',
        'foodRating.remarks',
      ])
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

  async getRatingStatisticByMenuItemId(
    menu_item_id: number,
  ): Promise<RatingStatistic> {
    const queryString = `SELECT count(*) as total_count, AVG(foodRating.score) as average_score, min(foodRating.score) as min, max(foodRating.score) as max FROM ((Food_Rating as foodRating left join Order_SKU as orderSKU ON foodRating.order_sku_id = orderSKU.order_sku_id) left join SKU as sku ON sku.sku_id = orderSKU.sku_id) left join Menu_Item as menuItem ON menuItem.menu_item_id = sku.menu_item_id where menuItem.menu_item_id = ${menu_item_id} AND foodRating.is_active = 1`;

    const data = await this.entityManager.query(queryString);

    const result: RatingStatistic = {
      menu_item_id: menu_item_id,
      total_count: Number(data[0].total_count),
      average_score: Number(data[0].average_score) || null,
      max_score: Number(data[0].max) || null,
      min_score: Number(data[0].min) || null,
    };
    return result;
  }

  async getAllMediaByMenuItemId(menu_item_id: number): Promise<Media[]> {
    // Get data from table Media
    // - image profile
    // - other iamge with menu_item_id
    // - package image with packaging_id

    //Get list of packaging_id
    const packaging_ids = (
      await this.entityManager
        .createQueryBuilder(Packaging, 'packaging')
        .where('packaging.menu_item_id = :menu_item_id', { menu_item_id })
        .select(['packaging.packaging_id'])
        .getMany()
    ).map((item) => item.packaging_id);

    //Select medias
    const data = await this.entityManager
      .createQueryBuilder(Media, 'media')
      .leftJoin('media.menu_item_obj', 'menuItem')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .orWhere('media.menu_item_id = :menu_item_id', { menu_item_id })
      .orWhere('media.packaging_id IN (:...packaging_ids)', { packaging_ids })
      .getMany();
    return data;
  }

  async getPackagingByMenuItemId(menu_item_id: number): Promise<Packaging[]> {
    const data = await this.entityManager
      .createQueryBuilder(Packaging, 'packaging')
      .leftJoinAndSelect('packaging.packaging_ext_obj', 'ext')
      .where('packaging.menu_item_id = :menu_item_id', { menu_item_id })
      .getMany();
    return data;
  }

  async getRecipeByMenuItemId(menu_item_id: number): Promise<Recipe[]> {
    const data = await this.entityManager
      .createQueryBuilder(Recipe, 'recipe')
      .leftJoinAndSelect('recipe.ingredient', 'ingredient')
      .leftJoinAndSelect('recipe.unit_obj', 'unit')
      .where('recipe.menu_item_id = :menu_item_id', { menu_item_id })
      .getMany();
    return data;
  }

  async getPortionCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemVariant[]> {
    const data = await this.entityManager
      .createQueryBuilder(MenuItemVariant, 'variant')
      .leftJoinAndSelect('variant.menu_item_variant_ext_obj', 'ext')
      .leftJoinAndSelect('variant.options', 'options')
      .leftJoinAndSelect('options.unit_obj', 'unit')
      .where('variant.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere("variant.type = 'portion'")
      .getMany();
    return data;
  }

  // async getTasteCustomizationByMenuItemId(
  //   menu_item_id: number,
  // ): Promise<MenuItemVariant[]> {
  //   const data = await this.entityManager
  //     .createQueryBuilder(MenuItemVariant, 'variant')
  //     .leftJoinAndSelect('variant.options', 'options')
  //     .leftJoinAndSelect('variant.taste_ext', 'tasteExt')
  //     .leftJoinAndSelect('options.taste_value_ext', 'tasteValueExt')
  //     .where('variant.menu_item_id = :menu_item_id', { menu_item_id })
  //     .andWhere("variant.type = 'taste'")
  //     .getMany();
  //   return data;
  // }

  // async getBasicCustomizationByMenuItemId(
  //   menu_item_id: number,
  // ): Promise<BasicCustomization[]> {
  //   const data = await this.entityManager
  //     .createQueryBuilder(BasicCustomization, 'basicCustomization')
  //     .leftJoinAndSelect('basicCustomization.extension', 'ext')
  //     .where('basicCustomization.menu_item_id = :menu_item_id', {
  //       menu_item_id,
  //     })
  //     .getMany();
  //   return data;
  // }

  async generatePackageSentenceByLang(packageInfo: Packaging[]) {
    const sentenceByLang: TextByLang[] = [];
    for (const item of packageInfo) {
      item.packaging_ext_obj.forEach((element) => {
        const sentence: TextByLang = {
          ISO_language_code: element.ISO_language_code,
          text: `${element.description} (+${item.price})`,
        };
        sentenceByLang.push(sentence);
      });
    }
    return sentenceByLang;
  }

  async convertPortionCustomization(
    portionCustomization: MenuItemVariant[],
  ): Promise<Option[]> {
    const options: Option[] = [];
    for (const item of portionCustomization) {
      const option: Option = {
        option_id: item.menu_item_variant_id.toString(),
        option_name: [],
        option_values: [],
      };
      //Option Name
      item.menu_item_variant_ext_obj.forEach((ext) => {
        const optionNameExt: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
        option.option_name.push(optionNameExt);
      });

      //Option Values
      item.options.forEach((optionValue) => {
        const value = {} as OptionValue;
        value.value_id = optionValue.menu_item_variant_option_id.toString();
        value.value_nubmer = optionValue.value;
        value.value_unit = optionValue.unit_obj.symbol;
        option.option_values.push(value);
      });

      options.push(option);
    }
    return options;
  }

  async convertTasteCustomization(
    tasteCustomization: MenuItemVariant[],
  ): Promise<Option[]> {
    const options: Option[] = [];
    for (const item of tasteCustomization) {
      const option: Option = {
        option_id: item.menu_item_variant_id.toString(),
        option_name: [],
        option_values: [],
      };
      //Option Name
      item.taste_ext.forEach((ext) => {
        const optionNameExt: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
        option.option_name.push(optionNameExt);
      });

      //Option Values
      item.options.forEach((optionValue) => {
        const value = {} as OptionValue;
        value.value_id = optionValue.menu_item_variant_option_id.toString();
        value.value_txt = optionValue.taste_value_ext.map((ext) => {
          return {
            ISO_language_code: ext.ISO_language_code,
            text: ext.name,
          };
        });
        option.option_values.push(value);
      });

      options.push(option);
    }
    return options;
  }

  async getListOfSkuById(id: number) {
    const result = new GeneralResponse(200, '');

    const data: SkuDTO[] = [];

    const rawSKUs = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.menu_item_variants', 'variant')
      .leftJoinAndSelect('variant.attribute', 'attribute')
      .where('sku.menu_item_id = :id', { id })
      .andWhere('sku.is_active = :active', { active: TRUE })
      .getMany();

    if (rawSKUs.length === 0) {
      result.statusCode = 404;
      result.message = 'SKUs not found';
      return result;
    }

    const priceUnit = await this.getMenuItemPriceUnit(id);

    for (const rawSKU of rawSKUs) {
      const sku: SkuDTO = {
        sku_id: rawSKU.sku_id,
        price: rawSKU.price,
        price_after_discount:
          await this.commonService.getAvailableDiscountPrice(rawSKU),
        unit: priceUnit,
        is_standard: Boolean(rawSKU.is_standard),
        calorie_kcal: rawSKU.calorie_kcal,
        carb_g: rawSKU.carbohydrate_g,
        protein_g: rawSKU.protein_g,
        fat_g: rawSKU.fat_g,
        portion_customization: rawSKU.menu_item_variants
          .filter((i) => i.attribute.type == 'portion')
          .map((e) => {
            return {
              option_id: e.variant.toString(),
              value_id: e.option.toString(),
            };
          }),
      };

      data.push(sku);
    }

    result.statusCode = 200;
    result.message = 'Getting List Of SKUs Successfully';
    result.data = data;
    return result;
  }
  async getSkuPriceUnit(sku_id: number) {
    const unit = await this.entityManager
      .createQueryBuilder(Unit, 'unit')
      .leftJoin(Restaurant, 'restaurant', 'restaurant.unit = unit.unit_id')
      .leftJoin(
        MenuItem,
        'menuItem',
        'menuItem.restaurant_id = restaurant.restaurant_id',
      )
      .leftJoin(SKU, 'sku', 'sku.menu_item_id = menuItem.menu_item_id')
      .where('sku.sku_id = :sku_id', { sku_id })
      .getOne();
    return unit.symbol;
  }

  async getMenuItemPriceUnit(menu_item_id: number) {
    const unit = await this.entityManager
      .createQueryBuilder(Unit, 'unit')
      .leftJoin(Restaurant, 'restaurant', 'restaurant.unit = unit.unit_id')
      .leftJoin(
        MenuItem,
        'menuItem',
        'menuItem.restaurant_id = restaurant.restaurant_id',
      )
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .getOne();
    return unit.symbol;
  }

  async getSideDishByMenuItemId(
    inputData: GetSideDishRequest,
  ): Promise<GetSideDishResonse> {
    if (this.flagService.isFeatureEnabled('fes-23-get-side-dishes')) {
      const res = new GetSideDishResonse(200, '');

      const { menu_item_id, timestamp } = inputData;

      //Get the list of menu_item_id (side dishes) from table 'Main_Side_Dish'
      const sideDishesIds = (
        await this.entityManager
          .createQueryBuilder(MainSideDish, 'mainSideDish')
          .where('mainSideDish.main_dish_id = :main_dish_id', {
            main_dish_id: menu_item_id,
          })
          .select('mainSideDish.side_dish_id')
          .getMany()
      ).map((item) => item.side_dish_id);

      // Check if there is no sidedish for this main dish
      if (sideDishesIds.length === 0) {
        res.statusCode = 404;
        res.message = 'No side dishes found';
        return res;
      }

      //Get main dish schedule
      const mainDishSchedule = JSON.parse(
        (
          await this.entityManager
            .createQueryBuilder(MenuItem, 'menuItem')
            .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
            .getOne()
        )?.cooking_schedule || null,
      );

      //get the earlies available dayshift of main dish
      const earliestDayShift = this.getEarliesAvailabeDayShift(
        timestamp,
        mainDishSchedule,
      );

      //Get data for the side dishes
      const sideDishes = await this.getFoodsWithListOfMenuItem(sideDishesIds);

      //Filter availabe side dishes
      const availableSideDishes = sideDishes.filter((sideDish) => {
        const sideDishSchedule: DayShift[] = JSON.parse(
          sideDish.cooking_schedule,
        );
        const correspondingDayShift = sideDishSchedule.find(
          (dayShift) =>
            dayShift.dayId == earliestDayShift.dayId &&
            dayShift.from == earliestDayShift.from &&
            dayShift.to == earliestDayShift.to,
        );
        return correspondingDayShift.isAvailable == true;
      });

      //Convert to DTO
      const sideDishesDTOs: FoodDTO[] = [];
      for (const availableSideDish of availableSideDishes) {
        const sidesideDishesDTO: FoodDTO =
          await this.commonService.convertIntoFoodDTO(availableSideDish);
        sideDishesDTOs.push(sidesideDishesDTO);
      }

      res.statusCode = 200;
      res.message = 'Get side dishes successfully';
      res.data = sideDishesDTOs;
      return res;
    }
  }

  getEarliesAvailabeDayShift(
    timestamp: number,
    schedule: DayShift[],
  ): DayShift {
    if (this.flagService.isFeatureEnabled('fes-23-get-side-dishes')) {
      const now = new Date(timestamp);
      const currentTimeString = `${now
        .getHours()
        .toString()
        .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
      console.log(currentTimeString);
      const currentDayShift: DayShift = {
        dayId: (now.getDay() + 1).toString(),
        dayName: '',
        from: '   ',
        to: '',
      };
      switch (currentDayShift.dayId) {
        case '1':
          currentDayShift.dayName = Day.Sunday;
          break;
        case '2':
          currentDayShift.dayName = Day.Monday;
          break;
        case '3':
          currentDayShift.dayName = Day.Tuesday;
          break;
        case '4':
          currentDayShift.dayName = Day.Wednesday;
          break;
        case '5':
          currentDayShift.dayName = Day.Thursday;
          break;
        case '6':
          currentDayShift.dayName = Day.Friday;
          break;
        case '7':
          currentDayShift.dayName = Day.Saturday;
          break;

        default:
          break;
      }
      if (
        currentTimeString >= Shift.MorningFrom &&
        currentTimeString <= Shift.MorningTo
      ) {
        currentDayShift.from = Shift.MorningFrom;
        currentDayShift.to = Shift.MorningTo;
      } else if (
        currentTimeString >= Shift.AfternoonFrom &&
        currentTimeString <= Shift.AfternoonTo
      ) {
        currentDayShift.from = Shift.AfternoonFrom;
        currentDayShift.to = Shift.AfternoonTo;
      } else if (
        currentTimeString >= Shift.NightFrom ||
        currentTimeString <= Shift.NightTo
      ) {
        currentDayShift.from = Shift.NightFrom;
        currentDayShift.to = Shift.NightTo;
      }

      //Get earliest available day shift
      const earliestAvailabeDayShift: DayShift = {
        dayId: null,
        dayName: null,
        from: null,
        to: null,
        isAvailable: null,
      };
      const currentIndex = schedule.findIndex(
        (item) =>
          item.dayId == currentDayShift.dayId &&
          item.from == currentDayShift.from &&
          item.to == currentDayShift.to,
      );
      for (
        let index = currentIndex;
        index < schedule.length + currentIndex;
        index++
      ) {
        const i = index % schedule.length;
        if (schedule[i].isAvailable) {
          earliestAvailabeDayShift.dayId = schedule[i].dayId;
          earliestAvailabeDayShift.dayName = schedule[i].dayName;
          earliestAvailabeDayShift.from = schedule[i].from;
          earliestAvailabeDayShift.to = schedule[i].to;
          earliestAvailabeDayShift.isAvailable = schedule[i].isAvailable;
          break;
        }
      }
      return earliestAvailabeDayShift;
    }
  }
}
