import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from 'src/entity/menu-item.entity';
import {
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  DeliveryRestaurant,
  Option,
  OptionValue,
  PriceRange,
  RatingStatistic,
  Review,
  TextByLang,
} from 'src/type';
import { SKU } from 'src/entity/sku.entity';
import { SkuDiscount } from 'src/entity/sku-discount.entity';
import { PERCENTAGE } from 'src/constant/unit.constant';
import { FALSE, TRUE } from 'src/constant';
import { FoodDTO } from '../../dto/food.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { FoodRating } from 'src/entity/food-rating.entity';
import { Media } from 'src/entity/media.entity';
import { Packaging } from 'src/entity/packaging.entity';
import { Recipe } from 'src/entity/recipe.entity';
import { MenuItemVariant } from 'src/entity/menu-item-variant.entity';
import { BasicCustomization } from 'src/entity/basic-customization.entity';
import { CommonService } from '../common/common.service';

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
    if (this.flagService.isFeatureEnabled('fes-12-search-food-by-name')) {
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
    //CURRENT LOGIC
    const query =
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
    }
    //CURRENT LOGIC
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

  async getFoodDetailByMenuItemId(
    menuItemId: number,
  ): Promise<GeneralResponse> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
        await this.getTasteCustomizationByMenuItemId(menuItemId);
      const convertedTasteCustomization =
        await this.convertTasteCustomization(tasteCustomization);

      //Get basic customization
      const basicCustomization =
        await this.getBasicCustomizationByMenuItemId(menuItemId);
      const convertedBasicCustomization = [];
      for (const basic of basicCustomization) {
        const customizedItem = {
          basic_customization_id: basic.basic_customization_id,
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
    //CURRENT LOGIC
  }

  async getReviewByMenuItemId(menu_item_id: number): Promise<Review[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async getRatingStatisticByMenuItemId(
    menu_item_id: number,
  ): Promise<RatingStatistic> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async getAllMediaByMenuItemId(menu_item_id: number): Promise<Media[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async getPackagingByMenuItemId(menu_item_id: number): Promise<Packaging[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(Packaging, 'packaging')
        .leftJoinAndSelect('packaging.packaging_ext_obj', 'ext')
        .where('packaging.menu_item_id = :menu_item_id', { menu_item_id })
        .getMany();
      return data;
    }
    //CURRENT LOGIC
  }

  async getRecipeByMenuItemId(menu_item_id: number): Promise<Recipe[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(Recipe, 'recipe')
        .leftJoinAndSelect('recipe.ingredient', 'ingredient')
        .leftJoinAndSelect('recipe.unit_obj', 'unit')
        .where('recipe.menu_item_id = :menu_item_id', { menu_item_id })
        .getMany();
      return data;
    }
    //CURRENT LOGIC
  }

  async getPortionCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemVariant[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async getTasteCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<MenuItemVariant[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async getBasicCustomizationByMenuItemId(
    menu_item_id: number,
  ): Promise<BasicCustomization[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(BasicCustomization, 'basicCustomization')
        .leftJoinAndSelect('basicCustomization.extension', 'ext')
        .where('basicCustomization.menu_item_id = :menu_item_id', {
          menu_item_id,
        })
        .getMany();
      return data;
    }
    //CURRENT LOGIC
  }

  async generatePackageSentenceByLang(packageInfo: Packaging[]) {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async convertPortionCustomization(
    portionCustomization: MenuItemVariant[],
  ): Promise<Option[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }

  async convertTasteCustomization(
    tasteCustomization: MenuItemVariant[],
  ): Promise<Option[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
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
    //CURRENT LOGIC
  }
}
