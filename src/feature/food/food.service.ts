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
import { SkuDTO } from 'src/dto/sku.dto';
import { Unit } from 'src/entity/unit.entity';
import { Restaurant } from 'src/entity/restaurant.entity';

@Injectable()
export class FoodService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(SKU) private skuRepo: Repository<SKU>,
    @InjectEntityManager() private entityManager: EntityManager,
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

  async getFoodDetailByMenuItemId(menuItemId: number) {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const result = new GeneralResponse(200, '');
      //Get basic food data
      const foods = await this.getFoodsWithListOfMenuItem(
        [menuItemId],
        [],
        FALSE,
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

      //Get taste customization
      const tasteCustomization =
        await this.getTasteCustomizationByMenuItemId(menuItemId);

      if (foods.length === 0) {
        result.statusCode = 404;
        result.message = 'Food not found';
        return result;
      }

      result.statusCode = 200;
      result.message = 'Getting Food Detail Successfully';
      result.data = tasteCustomization;
      return result;
    } else {
    }
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
    } else {
    }
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
    } else {
    }
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
    } else {
    }
  }

  async getPackagingByMenuItemId(menu_item_id: number): Promise<Packaging[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(Packaging, 'packaging')
        .leftJoinAndSelect('packaging.packaging_ext_obj', 'ext')
        .where('packaging.menu_item_id = :menu_item_id', { menu_item_id })
        .getMany();
      return data;
    } else {
    }
  }

  async getRecipeByMenuItemId(menu_item_id: number): Promise<Recipe[]> {
    if (this.flagService.isFeatureEnabled('fes-15-get-food-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(Recipe, 'recipe')
        .leftJoinAndSelect('recipe.ingredient', 'ingredient')
        .where('recipe.menu_item_id = :menu_item_id', { menu_item_id })
        .getMany();
      return data;
    } else {
    }
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
    } else {
    }
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
    } else {
    }
  }

  async getListOfSkuById(id: number) {
    if (this.flagService.isFeatureEnabled('fes-16-get-list-of-skus')) {
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
          price: rawSKU.price,
          price_after_discount: await this.getAvailableDiscountPrice(rawSKU),
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
    } else {
    }
  }
  async getSkuPriceUnit(sku_id: number) {
    if (this.flagService.isFeatureEnabled('fes-16-get-list-of-skus')) {
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
    } else {
    }
  }

  async getMenuItemPriceUnit(menu_item_id: number) {
    if (this.flagService.isFeatureEnabled('fes-16-get-list-of-skus')) {
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
    } else {
    }
  }
}
