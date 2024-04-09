import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  DayShift,
  Option,
  OptionValue,
  PackagingInfo,
  PortionAttribute,
  PortionAttributeValue,
  PortionValue,
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
import { Recipe } from 'src/entity/recipe.entity';
import { MenuItemAttribute } from 'src/entity/menu-item-attribute.entity';
import { SkuDTO } from 'src/dto/sku.dto';
import { Unit } from 'src/entity/unit.entity';
import { Restaurant } from 'src/entity/restaurant.entity';
import { CommonService } from '../common/common.service';
import { GetSideDishRequest } from './dto/get-side-dish-request.dto';
import { GetSideDishResonse } from './dto/get-side-dish-response.dto';
import { MainSideDish } from 'src/entity/main-side-dish.entity';
import { DayName, FetchMode, Shift } from 'src/enum';
import { FoodDTO } from 'src/dto/food.dto';
import { GetFoodDetailResponse } from './dto/get-food-detail-response.dto';
import { readFileSync } from 'fs';
import { MenuItemPackaging } from 'src/entity/menuitem-packaging.entity';
import { GetSimilarFoodResponse } from './dto/get-similar-food-response.dto';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { MenuItemExt } from 'src/entity/menu-item-ext.entity';
import {
  RecipeItem,
  PortionCustomizationItem,
  PriceSetting,
  TasteCustomizationItem,
} from './dto/create-menu-item-request.dto';
import { BasicCustomization } from 'src/entity/basic-customization.entity';
import { MenuItemAttributeExt } from 'src/entity/menu-item-attribute-ext.entity';
import { MenuItemAttributeValue } from 'src/entity/menu-item-attribute-value.entity';
import { MenuItemAttributeIngredient } from 'src/entity/menu-item-attribute-ingredient.entity';
import { SkuDetail } from 'src/entity/sku-detail.entity';
import { RpcException } from '@nestjs/microservices';

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

  private readonly logger = new Logger(FoodService.name);

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
  } // end of getPriceRangeByMenuItem

  async getFoodsWithListOfRestaurants(restaurantIds: number[]) {
    if (!restaurantIds || restaurantIds.length === 0) {
      return [];
    }
    const foodList = await this.menuItemRepo
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'media')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
      .where('menuItem.restaurant_id IN (:...restaurantIds)', { restaurantIds })
      .andWhere('menuItem.is_active = :active', { active: TRUE })
      .andWhere('sku.is_standard = :standard', { standard: TRUE })
      .andWhere('sku.is_active = :active', { active: TRUE })
      .getMany();
    return foodList;
  } // end of getFoodsWithListOfRestaurants

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
          .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
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
          .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
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
          .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
          .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
          .andWhere('menuItem.is_active = :active', { active: TRUE })
          .getMany();
      } else if (langs.length > 0) {
        foodList = await this.menuItemRepo
          .createQueryBuilder('menuItem')
          .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
          .leftJoinAndSelect('menuItem.image_obj', 'media')
          .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
          .where('menuItem.menu_item_id IN (:...menuItems)', { menuItems })
          .andWhere('menuItem.is_active = :active', { active: TRUE })
          .andWhere('menuItemExt.ISO_language_code IN (:...langs)', { langs })
          .getMany();
      }
    }

    return foodList;
  } // end of getFoodsWithListOfMenuItem

  async getFoodDetailByMenuItemId(
    menuItemId: number,
  ): Promise<GetFoodDetailResponse> {
    const result = new GetFoodDetailResponse(200, '');
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
    const restaurant = await this.commonService.getRestaurantById(
      foods[0].restaurant_id,
    );
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

    let isAdvancedCustomizable: boolean = false;
    if (!!foods[0].attribute_obj) {
      if (
        foods[0].attribute_obj.filter((i) => i.type_id == 'taste').length > 0
      ) {
        isAdvancedCustomizable = true;
      }
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
      packaging_info: await this.generatePackagingInfoForMenuItem(
        packaging,
        menuItemId,
      ),
      cutoff_time_m: restaurant.cutoff_time_m,
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
      is_advanced_customizable: isAdvancedCustomizable,
    };

    result.statusCode = 200;
    result.message = 'Getting Food Detail Successfully';
    result.data = data;
    return result;
  } // end of getFoodDetailByMenuItemId

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
  } // end of getReviewByMenuItemId

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
  } // end of getRatingStatisticByMenuItemId

  async getAllMediaByMenuItemId(menu_item_id: number): Promise<Media[]> {
    // Get data from table Media
    // - image profile
    // - other iamge with menu_item_id

    //Select medias
    const data = await this.entityManager
      .createQueryBuilder(Media, 'media')
      .leftJoin('media.menu_item_obj', 'menuItem')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .orWhere('media.menu_item_id = :menu_item_id', { menu_item_id })
      .getMany();
    return data;
  } // end of getAllMediaByMenuItemId

  async getPackagingByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemPackaging[]> {
    // const data = await this.entityManager
    //   .createQueryBuilder(Packaging, 'packaging')
    //   .leftJoinAndSelect('packaging.packaging_ext_obj', 'ext')
    //   .where('packaging.menu_item_id = :menu_item_id', { menu_item_id })
    //   .getMany();

    const data = await this.entityManager
      .createQueryBuilder(MenuItemPackaging, 'menuItemPackaging')
      .leftJoinAndSelect('menuItemPackaging.image_obj', 'itemImage')
      .leftJoinAndSelect('menuItemPackaging.packaging_obj', 'packaging')
      .leftJoinAndSelect('packaging.packaging_ext_obj', 'packageExt')
      .leftJoinAndSelect('packaging.media_obj', 'media')
      .where('menuItemPackaging.menu_item_id = :menu_item_id', { menu_item_id })
      .getMany();
    return data;
  } // end of getPackagingByMenuItemId

  async getRecipeByMenuItemId(menu_item_id: number): Promise<Recipe[]> {
    const data = await this.entityManager
      .createQueryBuilder(Recipe, 'recipe')
      .leftJoinAndSelect('recipe.ingredient', 'ingredient')
      .leftJoinAndSelect('recipe.unit_obj', 'unit')
      .where('recipe.menu_item_id = :menu_item_id', { menu_item_id })
      .getMany();
    return data;
  } // end of getRecipeByMenuItemId

  async getPortionCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemAttribute[]> {
    const data = await this.entityManager
      .createQueryBuilder(MenuItemAttribute, 'attribute')
      .leftJoinAndSelect('attribute.menu_item_attribute_ext_obj', 'ext')
      .leftJoinAndSelect('attribute.values', 'values')
      .leftJoinAndSelect('values.unit_obj', 'unit')
      .where('attribute.menu_item_id = :menu_item_id', { menu_item_id })
      .andWhere("attribute.type_id = 'portion'")
      .getMany();
    return data;
  } // end of getPortionCustomizationByMenuItemId

  async generatePackagingInfoForMenuItem(
    menuItemPackagings: MenuItemPackaging[],
    menu_item_id: number,
  ): Promise<PackagingInfo[]> {
    const currency = await this.getCurrencyOfMenuItem(menu_item_id);
    const packagingInfos: PackagingInfo[] = [];
    for (const menuItemPackaging of menuItemPackagings) {
      //packaging image
      let image_url = '';
      if (menuItemPackaging.image_obj) {
        image_url = menuItemPackaging.image_obj.url;
      } else if (menuItemPackaging.packaging_obj.media_obj.length > 0) {
        image_url = menuItemPackaging.packaging_obj.media_obj[0].url;
      } else {
        image_url = null;
      }
      //packaging name & description
      const name = [];
      const description = [];
      menuItemPackaging.packaging_obj.packaging_ext_obj.forEach((e) => {
        const nameExt: TextByLang = {
          ISO_language_code: e.ISO_language_code,
          text: e.name,
        };
        name.push(nameExt);
        const descriptionExt: TextByLang = {
          ISO_language_code: e.ISO_language_code,
          text: e.description,
        };
        description.push(descriptionExt);
      });

      const packagingInfo: PackagingInfo = {
        packaging_id: menuItemPackaging.packaging_id,
        image_url: image_url,
        name: name,
        description: description,
        price: menuItemPackaging.packaging_obj.price,
        currency: currency.symbol,
        is_default: Boolean(menuItemPackaging.is_default),
      };
      packagingInfos.push(packagingInfo);
    }
    return packagingInfos;
  } // end of generatePackagingInfoForMenuItem

  async convertPortionCustomization(
    portionCustomization: MenuItemAttribute[],
  ): Promise<Option[]> {
    const options: Option[] = [];
    for (const item of portionCustomization) {
      const option: Option = {
        option_id: item.attribute_id.toString(),
        option_name: [],
        option_values: [],
      };
      //Option Name
      item.menu_item_attribute_ext_obj.forEach((ext) => {
        const optionNameExt: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
        option.option_name.push(optionNameExt);
      });

      //Option Values
      item.values.forEach((optionValue) => {
        const value = {} as OptionValue;
        value.value_id = optionValue.value_id.toString();
        value.value_nubmer = optionValue.value;
        value.value_unit = optionValue.unit_obj.symbol;
        option.option_values.push(value);
      });

      options.push(option);
    }
    return options;
  } // end of convertPortionCustomization

  async convertTasteCustomization(
    tasteCustomization: MenuItemAttribute[],
  ): Promise<Option[]> {
    const options: Option[] = [];
    for (const item of tasteCustomization) {
      const option: Option = {
        option_id: item.attribute_id.toString(),
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
      item.values.forEach((optionValue) => {
        const value = {} as OptionValue;
        value.value_id = optionValue.value_id.toString();
        value.value_txt = optionValue.taste_value_obj.taste_value_ext.map(
          (ext) => {
            return {
              ISO_language_code: ext.ISO_language_code,
              text: ext.name,
            };
          },
        );
        value.is_default = Boolean(
          optionValue.taste_value_obj.is_default_taste,
        );
        value.order = optionValue.taste_value_obj.order;
        option.option_values.push(value);
      });

      options.push(option);
    }
    return options;
  } // end of convertTasteCustomization

  async getListOfSkuById(id: number) {
    const result = new GeneralResponse(200, '');

    const data: SkuDTO[] = [];

    const rawSKUs = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.detail', 'skuDetail')
      .leftJoinAndSelect('skuDetail.attribute_obj', 'attribute')
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
        calorie_kcal: Number(rawSKU.calorie_kcal),
        carb_g: Number(rawSKU.carbohydrate_g),
        protein_g: Number(rawSKU.protein_g),
        fat_g: Number(rawSKU.fat_g),
        portion_customization: rawSKU.detail
          .filter((i) => i.attribute_obj.type_id == 'portion')
          .map((e) => {
            return {
              option_id: e.attribute_id.toString(),
              value_id: e.value_id.toString(),
            };
          }),
      };

      data.push(sku);
    }

    result.statusCode = 200;
    result.message = 'Getting List Of SKUs Successfully';
    result.data = data;
    return result;
  } // end of getListOfSkuById

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
  } // end of getSkuPriceUnit

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
  } // end of getMenuItemPriceUnit

  async getSideDishByMenuItemId(
    inputData: GetSideDishRequest,
  ): Promise<GetSideDishResonse> {
    const res = new GetSideDishResonse(200, '');

    const { menu_item_id, timestamp, fetch_mode } = inputData;

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
      // res.statusCode = 404;
      // res.message = 'No side dishes found';
      res.statusCode = 200;
      res.message = 'Get side dishes successfully';
      res.data = [];
      return res;
    }

    //Get main dish schedule
    const mainDish = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .getOne();
    const mainDishSchedule = JSON.parse(mainDish?.cooking_schedule || null);

    //get the earlies available dayshift of main dish
    const restaurantUtcTimeZone = await this.commonService.getUtcTimeZone(
      mainDish.restaurant_id,
    );
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST
    const earliestDayShift = this.getEarliesAvailabeDayShift(
      timestamp,
      timeZoneOffset,
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
          dayShift.day_id == earliestDayShift.day_id &&
          dayShift.from == earliestDayShift.from &&
          dayShift.to == earliestDayShift.to,
      );
      return correspondingDayShift.is_available == true;
    });

    let fillteredSideDishes = [];
    switch (fetch_mode) {
      case FetchMode.Some:
        fillteredSideDishes = availableSideDishes.slice(0, 3); // get only 3 items
        break;

      case FetchMode.Full:
        fillteredSideDishes = availableSideDishes;
        break;

      default:
        throw new HttpException('fetch_mode is invalid', 400);
    }

    //Convert to DTO
    const sideDishesDTOs: FoodDTO[] = [];
    for (const sideDish of fillteredSideDishes) {
      const sidesideDishesDTO: FoodDTO =
        await this.commonService.convertIntoFoodDTO(sideDish);
      sideDishesDTOs.push(sidesideDishesDTO);
    }

    res.statusCode = 200;
    res.message = 'Get side dishes successfully';
    res.data = sideDishesDTOs;
    return res;
  } // end of getSideDishByMenuItemId

  getEarliesAvailabeDayShift(
    timestamp: number,
    time_zone_offset_in_milliseconds: number,
    schedule: DayShift[],
  ): DayShift {
    const adjustedNow = new Date(timestamp + time_zone_offset_in_milliseconds);
    const currentTimeString = `${adjustedNow
      .getUTCHours()
      .toString()
      .padStart(2, '0')}:${adjustedNow
      .getUTCMinutes()
      .toString()
      .padStart(2, '0')}:${adjustedNow
      .getUTCSeconds()
      .toString()
      .padStart(2, '0')}`;

    //Step 1: Find the current day shift which matches the time of now
    const currentDayShift: DayShift = {
      day_id: adjustedNow.getUTCDay() + 1,
      day_name: '',
      from: '   ',
      to: '',
    };
    switch (currentDayShift.day_id) {
      case 1:
        currentDayShift.day_name = DayName.Sunday;
        break;
      case 2:
        currentDayShift.day_name = DayName.Monday;
        break;
      case 3:
        currentDayShift.day_name = DayName.Tuesday;
        break;
      case 4:
        currentDayShift.day_name = DayName.Wednesday;
        break;
      case 5:
        currentDayShift.day_name = DayName.Thursday;
        break;
      case 6:
        currentDayShift.day_name = DayName.Friday;
        break;
      case 7:
        currentDayShift.day_name = DayName.Saturday;
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

    //Step 2: Get earliest available day shift by loopping the schedule
    //        from the current day shift index
    const earliestAvailabeDayShift: DayShift = {
      day_id: null,
      day_name: null,
      from: null,
      to: null,
      is_available: null,
    };
    const currentIndex = schedule.findIndex(
      (item) =>
        item.day_id == currentDayShift.day_id &&
        item.from == currentDayShift.from &&
        item.to == currentDayShift.to,
    );
    for (
      let index = currentIndex;
      index < schedule.length + currentIndex;
      index++
    ) {
      const i = index % schedule.length;
      if (schedule[i].is_available) {
        earliestAvailabeDayShift.day_id = schedule[i].day_id;
        earliestAvailabeDayShift.day_name = schedule[i].day_name;
        earliestAvailabeDayShift.from = schedule[i].from;
        earliestAvailabeDayShift.to = schedule[i].to;
        earliestAvailabeDayShift.is_available = schedule[i].is_available;
        break;
      }
    }
    return earliestAvailabeDayShift;
  } // end of getEarliesAvailabeDayShift

  async getHotFoodFromEndPoint(): Promise<FoodDTO[]> {
    const foods: FoodDTO[] = [];
    try {
      const filePath = 'src/fake_data/hot-food.json';
      const fileContent = readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(fileContent) as FoodDTO[];
      parsedData.forEach((item) => {
        foods.push(item);
      });
    } catch (error) {
      console.error('Error reading JSON file:', error);
      throw error;
    }
    return foods;
  } // end of getHotFoodFromEndPoint

  async getAvailableFoodByRestaurantFromEndPoint(
    menu_item_id: number,
    timestamp: number,
    fetch_mode: FetchMode,
  ): Promise<FoodDTO[]> {
    const foods: FoodDTO[] = [];

    // Get main dish detail
    const mainDish = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .getOne();

    // get list of menu_item_id of the restaurant except for the main dish
    const menuItemIds = (
      await this.entityManager
        .createQueryBuilder(MenuItem, 'menuItem')
        .where('menuItem.restaurant_id = :restaurant_id', {
          restaurant_id: mainDish.restaurant_id,
        })
        .andWhere('menuItem.menu_item_id <> :menu_item_id', { menu_item_id })
        .select('menuItem.menu_item_id')
        .getMany()
    ).map((i) => i.menu_item_id);

    //Get data for the side dishes
    const menuItems = await this.getFoodsWithListOfMenuItem(menuItemIds);

    // Check if there is no side dish for this main dish
    if (menuItemIds.length === 0) {
      // throw new HttpException('No food found', HttpStatus.NOT_FOUND);
      return [];
    }

    //Get main dish schedule
    const mainDishSchedule = JSON.parse(mainDish?.cooking_schedule || null);

    //get the earlies available dayshift of main dish
    const restaurantUtcTimeZone = await this.commonService.getUtcTimeZone(
      mainDish.restaurant_id,
    );
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST
    const earliestDayShift = this.getEarliesAvailabeDayShift(
      timestamp,
      timeZoneOffset,
      mainDishSchedule,
    );

    //Filter availabe side dishes
    const availableMenuItems = menuItems.filter((item) => {
      const sideDishSchedule: DayShift[] = JSON.parse(item.cooking_schedule);
      const correspondingDayShift = sideDishSchedule.find(
        (dayShift) =>
          dayShift.day_id == earliestDayShift.day_id &&
          dayShift.from == earliestDayShift.from &&
          dayShift.to == earliestDayShift.to,
      );
      return correspondingDayShift.is_available == true;
    });

    //Filter by fetch mode
    let fillteredMenuItems = [];
    switch (fetch_mode) {
      case FetchMode.Some:
        fillteredMenuItems = availableMenuItems.slice(0, 3); // get only 3 items
        break;

      case FetchMode.Full:
        fillteredMenuItems = availableMenuItems;
        break;

      default:
        fillteredMenuItems = availableMenuItems.slice(0, 3); // get only 3 items
        break;
    }

    //Convert to DTO
    for (const menuItem of fillteredMenuItems) {
      const food: FoodDTO =
        await this.commonService.convertIntoFoodDTO(menuItem);
      foods.push(food);
    }
    return foods;
  } // end of getAvailableFoodByRestaurantFromEndPoint

  async getCurrencyOfMenuItem(menu_item_id: number): Promise<Unit> {
    const menuItem = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .leftJoinAndSelect('menuItem.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.unit_obj', 'unit')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .getOne();
    return menuItem.restaurant.unit_obj;
  }
  //end of getCurrencyOfMenuItem

  async getSimilarMenuItems(
    menu_item_id: number,
    fetch_mode: string,
  ): Promise<number[]> {
    const PRICE_VARIANCE = 0.2; //20%
    const menuItem = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .where('menuItem.menu_item_id = :menu_item_id', { menu_item_id })
      .getOne();
    if (!menuItem) {
      this.logger.error('Menu item is not found');
      throw new CustomRpcException(2, 'Menu item is not found');
    }
    const standardSku = menuItem.skus.find(
      (i) => i.is_standard == 1 && i.is_active == 1,
    );
    if (!standardSku) {
      this.logger.error(
        'Cannot find the standard SKU for MenuItem ',
        menuItem.menu_item_id,
      );
      return [];
    }
    const priceRange: PriceRange = {
      min: standardSku.price - standardSku.price * PRICE_VARIANCE,
      max: standardSku.price + standardSku.price * PRICE_VARIANCE,
    };

    const similarSkus = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .where('sku.price BETWEEN :min AND :max', {
        min: priceRange.min,
        max: priceRange.max,
      })
      .andWhere('sku.is_active = 1')
      .andWhere('sku.is_standard = 1')
      .andWhere('sku.menu_item_id <> :menu_item_id', { menu_item_id })
      .getMany();
    if (similarSkus.length === 0) {
      return [];
    }
    const menuItemIds = similarSkus.map((i) => i.menu_item_id);

    let fillteredIds = [];
    switch (fetch_mode) {
      case FetchMode.Some:
        fillteredIds = menuItemIds.slice(0, 3); // get only 3 items
        break;

      case FetchMode.Full:
        fillteredIds = menuItemIds;
        break;

      default:
        this.logger.error('fetch_mode is invalid');
        // throw new HttpException('fetch_mode is invalid', 400);
        fillteredIds = menuItemIds.slice(0, 3); // get only 3 items
        break;
    }
    return fillteredIds;
  }

  async buildSimilarFoodResponse(
    menu_item_ids: number[],
  ): Promise<GetSimilarFoodResponse> {
    const response: GetSimilarFoodResponse = {
      foods: [],
    };
    if (menu_item_ids.length === 0) return response;
    const menuItems = await this.getFoodsWithListOfMenuItem(menu_item_ids);
    for (const menuItem of menuItems) {
      const food: FoodDTO =
        await this.commonService.convertIntoFoodDTO(menuItem);
      response.foods.push(food);
    }

    return response;
  }

  async createMenuItemFromRestaurant(
    restaurant_id: number,

    ISO_language_code,

    name: string,

    short_name: string,

    description: string,

    main_cooking_method: string,

    preparing_time_minutes: number,

    cooking_time_minutes: number,

    is_vegetarian: boolean,

    res_category_id: number,

    image_url: string,

    other_image_url: string[],

    basic_customization: string[],

    recipe: RecipeItem[],

    portion_customization: PortionCustomizationItem[],

    price: PriceSetting,

    taste_customization: TasteCustomizationItem[],

    packaging: number[],
  ): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      //insert table Media
      const menuItemImage = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Media)
        .values({
          type: 'image',
          name: short_name,
          url: image_url,
        })
        .execute();
      const menuItemImageId = Number(menuItemImage.identifiers[0].media_id);

      //insert table Menu_Item
      const menuItem = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(MenuItem)
        .values({
          restaurant_id: restaurant_id,
          is_active: 1,
          is_vegetarian: Number(is_vegetarian),
          cooking_schedule: '[]',
          res_category_id: res_category_id,
          preparing_time_s: preparing_time_minutes * 60,
          cooking_time_s: cooking_time_minutes * 60,
          image: menuItemImageId,
          standard_price: price.standard,
          min_price: price.min,
          max_price: price.max,
        })
        .execute();
      const menuItemId = Number(menuItem.identifiers[0].menu_item_id);

      //insert table Menu_Item_Ext
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(MenuItemExt)
        .values({
          menu_item_id: menuItemId,
          ISO_language_code: ISO_language_code,
          name: name,
          short_name: short_name,
          description: description,
          main_cooking_method: main_cooking_method,
        })
        .execute();

      //insert table Media
      for (let index = 0; index < other_image_url.length; index++) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(Media)
          .values({
            type: 'image',
            name: short_name + `_${index + 1}`,
            url: other_image_url[index],
            menu_item_id: menuItemId,
          })
          .execute();
      }

      //insert table Basic_Customization
      for (const basic of basic_customization) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(BasicCustomization)
          .values({
            menu_item_id: menuItemId,
            no_adding_id: basic,
          })
          .execute();
      }
      //insert table Recipe
      for (const recipeItem of recipe) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(Recipe)
          .values({
            ingredient_id: recipeItem.ingredient_id,
            menu_item_id: menuItemId,
            quantity: recipeItem.quantity,
            unit: recipeItem.unit_id,
          })
          .execute();
      }

      //insert Menu_Item_Attribute, Menu_Item_Attribute_Ext, Menu_Item_Attribute_Value
      const portionAttributes: PortionAttribute[] = [];
      for (const portionCustomizationItem of portion_customization) {
        const portionAttribute: PortionAttribute = {
          attribute_id: null,
          values: [],
        };

        //insert Menu_Item_Attribute
        const menuItemAttribute = await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(MenuItemAttribute)
          .values({
            menu_item_id: menuItemId,
            type_id: 'portion',
          })
          .execute();
        const menuItemAttributeId = Number(
          menuItemAttribute.identifiers[0].attribute_id,
        );
        portionAttribute.attribute_id = menuItemAttributeId;
        //insert Menu_Item_Attribute_Ext
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(MenuItemAttributeExt)
          .values({
            attribute_id: menuItemAttributeId,
            ISO_language_code: ISO_language_code,
            name: portionCustomizationItem.name,
          })
          .execute();
        //Menu_Item_Attribute_Value
        for (const val of portionCustomizationItem.value) {
          const portionValue: PortionValue = {
            value_id: null,
            price_variance: val.price_variance,
            is_standard: val.is_standard,
          };
          const menuItemAttributeValue = await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(MenuItemAttributeValue)
            .values({
              attribute_id: menuItemAttributeId,
              value: val.value,
              unit: val.unit_id,
              price_variance: val.price_variance,
              is_standard: Number(val.is_standard),
            })
            .execute();
          const menuItemAttributeValueId = Number(
            menuItemAttributeValue.identifiers[0].value_id,
          );
          portionValue.value_id = menuItemAttributeValueId;
          portionAttribute.values.push(portionValue);
        }

        //insert table Menu_Item_Attribute_Ingredient
        for (const ingredient of portionCustomizationItem.corresponding_ingredients) {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(MenuItemAttributeIngredient)
            .values({
              attribute_id: menuItemAttributeId,
              ingredient_id: ingredient,
            })
            .execute();
        }

        portionAttributes.push(portionAttribute);
      }

      // insert SKU, SKU_Detail
      await this.createSKUs(
        transactionalEntityManager,
        portionAttributes,
        menuItemId,
        price.standard,
        price.min,
        price.max,
        [],
      );

      // insert table Menu_Item_Attribute, Menu_Item_Attribute_Value
      for (const tasteCustomizationItem of taste_customization) {
        // insert table Menu_Item_Attribute
        const menuItemAttribute = await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(MenuItemAttribute)
          .values({
            menu_item_id: menuItemId,
            type_id: 'taste',
            taste_id: tasteCustomizationItem.taste_id,
          })
          .execute();
        const menuItemAttributeId = Number(
          menuItemAttribute.identifiers[0].attribute_id,
        );
        for (const tasteValue of tasteCustomizationItem.taste_values) {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(MenuItemAttributeValue)
            .values({
              attribute_id: menuItemAttributeId,
              taste_value: tasteValue,
            })
            .execute();
        }
      }

      //insert table MenuItem_Packaging
      for (let index = 0; index < packaging.length; index++) {
        if (index === 0) {
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(MenuItemPackaging)
            .values({
              menu_item_id: menuItemId,
              packaging_id: packaging[index],
              is_default: 1,
            })
            .execute();
          continue;
        }
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into(MenuItemPackaging)
          .values({
            menu_item_id: menuItemId,
            packaging_id: packaging[index],
          })
          .execute();
      }
    });
  }

  async createSKUs(
    entity_manager: EntityManager,
    portion_attributes: PortionAttribute[],
    menu_item_id: number,
    standard_price: number,
    min_price: number,
    max_price: number,
    // is_standard: number,
    // price_variance: number,
    previous_portion_attribute_values: PortionAttributeValue[],
  ): Promise<void> {
    const CALORIE_KCAL = 366.0;
    const PROTEIN_G = 4.0;
    const FAT_G = 2.7;
    const CARBONHYDRATE_G = 16.0;
    if (portion_attributes.length === 1) {
      for (const attributeValue of portion_attributes[0].values) {
        //Calculate price for SKU
        let price = 0;
        let estimatedPrice = standard_price + attributeValue.price_variance;
        // const estimatedPrice = standard_price + price_variance;
        for (const previousPortionAttributeValue of previous_portion_attribute_values) {
          estimatedPrice += previousPortionAttributeValue.price_variance;
        }
        if (estimatedPrice < min_price) {
          price = min_price;
        } else if (estimatedPrice > max_price) {
          price = max_price;
        } else {
          price = estimatedPrice;
        }

        //Check if SKU is standard
        let is_standard = 1;
        if (attributeValue.is_standard) {
          for (const previousPortionAttributeValue of previous_portion_attribute_values) {
            if (!previousPortionAttributeValue.is_standard) {
              is_standard = 0;
              break;
            }
          }
        } else {
          is_standard = 0;
        }

        //Insert SKU
        const sku = await entity_manager
          .createQueryBuilder()
          .insert()
          .into(SKU)
          .values({
            menu_item_id: menu_item_id,
            price: price,
            is_active: 1,
            is_standard: is_standard,
            calorie_kcal: (
              CALORIE_KCAL *
              (estimatedPrice / standard_price)
            ).toFixed(2),
            protein_g: (PROTEIN_G * (estimatedPrice / standard_price)).toFixed(
              2,
            ),
            fat_g: (FAT_G * (estimatedPrice / standard_price)).toFixed(2),
            carbohydrate_g: (
              CARBONHYDRATE_G *
              (estimatedPrice / standard_price)
            ).toFixed(2),
          })
          .execute();
        const skuId = Number(sku.identifiers[0].sku_id);

        //Insert SKU Detail
        await entity_manager
          .createQueryBuilder()
          .insert()
          .into(SkuDetail)
          .values({
            sku_id: skuId,
            attribute_id: portion_attributes[0].attribute_id,
            value_id: attributeValue.value_id,
          })
          .execute();
        for (const previousPortionAttributeValue of previous_portion_attribute_values) {
          await entity_manager
            .createQueryBuilder()
            .insert()
            .into(SkuDetail)
            .values({
              sku_id: skuId,
              attribute_id: previousPortionAttributeValue.attribute_id,
              value_id: previousPortionAttributeValue.value_id,
            })
            .execute();
        }
      }
    } else if (portion_attributes.length > 1) {
      for (const attributeValue of portion_attributes[0].values) {
        //Add data to sku_details
        const previousPortionAttributeValues = [
          ...previous_portion_attribute_values,
        ];
        previousPortionAttributeValues.push({
          attribute_id: portion_attributes[0].attribute_id,
          value_id: attributeValue.value_id,
          price_variance: attributeValue.price_variance,
          is_standard: attributeValue.is_standard,
        });
        //Recursive call
        await this.createSKUs(
          entity_manager,
          portion_attributes.slice(1),
          menu_item_id,
          standard_price,
          min_price,
          max_price,
          previousPortionAttributeValues,
        );
      }
    } else {
      this.logger.error('unknown error');
      throw new CustomRpcException(999, 'unknown error');
    }
  }
}
