import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TRUE } from 'src/constant';
import { SysCategory } from 'src/entity/sys-category.entity';
import { Repository } from 'typeorm';
import { SysCategoryDTO } from './dto/sys-category.dto';
import { SearchResult } from 'src/dto/search-result.dto';
import { SysCategoryMenuItem } from 'src/entity/sys-category-menu-item.entity';
import { FoodService } from '../food/food.service';
import { SearchByCategory } from './dto/search-by-category-request.dto';
import { RestaurantService } from '../restaurant/restaurant.service';
import { PriceRange } from 'src/type';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(SysCategory)
    private readonly sysCategoryRepo: Repository<SysCategory>,
    @InjectRepository(SysCategoryMenuItem)
    private readonly sysCatMenuItemRepo: Repository<SysCategoryMenuItem>,
    private readonly foodService: FoodService,
    private readonly restaurantService: RestaurantService,
  ) {}

  async getCategories(): Promise<any> {
    if (
      this.flagService.isFeatureEnabled(
        'fes-19-refactor-all-the-end-point-with-general-response',
      )
    ) {
      const response = new GeneralResponse(200, '');
      const categoriesDTO: SysCategoryDTO[] = [];
      const categories = await this.sysCategoryRepo.find({
        where: {
          is_active: TRUE,
        },
      });
      for (const category of categories) {
        const categoryDTO = new SysCategoryDTO();
        categoryDTO.sys_category_id = category.sys_category_id;
        categoryDTO.type = category.type;
        categoryDTO.image_url = category.image_obj.url;
        category.extension.forEach((ext) => {
          categoryDTO.name.push({
            ISO_language_code: ext.ISO_language_code,
            text: ext.name,
          });
          categoryDTO.description.push({
            ISO_language_code: ext.ISO_language_code,
            text: ext.description,
          });
        });
        categoriesDTO.push(categoryDTO);
      }

      //Build the response
      response.statusCode = 200;
      response.message = 'Get all categories successfully';
      response.data = categoriesDTO;

      return response;
    }
    //CURRENT LOGIC
    const categoriesDTO: SysCategoryDTO[] = [];
    const categories = await this.sysCategoryRepo.find({
      where: {
        is_active: TRUE,
      },
    });

    for (const category of categories) {
      const categoryDTO = new SysCategoryDTO();
      categoryDTO.sys_category_id = category.sys_category_id;
      categoryDTO.type = category.type;
      categoryDTO.image_url = category.image_obj.url;
      category.extension.forEach((ext) => {
        categoryDTO.name.push({
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        });
        categoryDTO.description.push({
          ISO_language_code: ext.ISO_language_code,
          text: ext.description,
        });
      });

      categoriesDTO.push(categoryDTO);
    }

    return categoriesDTO;
  }

  async searchFoodAndRestaurantByCategory(
    data: SearchByCategory,
  ): Promise<any> {
    if (
      this.flagService.isFeatureEnabled(
        'fes-19-refactor-all-the-end-point-with-general-response',
      )
    ) {
      const response = new GeneralResponse(200, '');
      const { category_id, lat, long } = data;
      const searchResult = new SearchResult();

      //Get list of menu_item_id
      const menuItemIds = (
        await this.sysCatMenuItemRepo.find({
          select: {
            menu_item_id: true,
          },
          where: {
            sys_category_id: category_id,
          },
        })
      ).map((item) => item.menu_item_id);

      //Check if there is no menu_item -> return []
      if (!menuItemIds || menuItemIds.length === 0) {
        return searchResult;
      }

      const foodList =
        await this.foodService.getFoodsWithListOfMenuItem(menuItemIds);

      const restaurants =
        await this.restaurantService.getDeliveryRestaurantByListOfId(
          foodList.map((food) => food.restaurant_id),
          lat,
          long,
        );

      //Fill up Food data
      for (const food of foodList) {
        const restaurant = restaurants.find(
          (res) => res.restaurant_id === food.restaurant_id,
        );
        const foodDTO = await this.foodService.convertIntoFoodDTO(
          food,
          restaurant,
        );
        searchResult.byFoods.push(foodDTO);
      }

      //Fill up Restaurant data
      for (const restaurant of restaurants) {
        const menuItems = await restaurant.menu_items;
        const priceRange: PriceRange =
          await this.foodService.getPriceRangeByMenuItem(
            menuItems.map((item) => item.menu_item_id),
          );
        const restaurantDTO =
          await this.restaurantService.convertIntoRestaurantDTO(
            restaurant,
            priceRange,
          );
        searchResult.byRestaurants.push(restaurantDTO);
      }

      //Build the response
      response.statusCode = 200;
      response.message = 'Search food and restaurant by category successfully';
      response.data = searchResult;

      return response;
    }
    //CURRENT LOGIC
    const { category_id, lat, long } = data;
    const searchResult = new SearchResult();

    //Get list of menu_item_id
    const menuItemIds = (
      await this.sysCatMenuItemRepo.find({
        select: {
          menu_item_id: true,
        },
        where: {
          sys_category_id: category_id,
        },
      })
    ).map((item) => item.menu_item_id);

    //Check if there is no menu_item -> return []
    if (!menuItemIds || menuItemIds.length === 0) {
      return searchResult;
    }

    const foodList =
      await this.foodService.getFoodsWithListOfMenuItem(menuItemIds);

    const restaurants =
      await this.restaurantService.getDeliveryRestaurantByListOfId(
        foodList.map((food) => food.restaurant_id),
        lat,
        long,
      );

    //Fill up Food data
    for (const food of foodList) {
      const restaurant = restaurants.find(
        (res) => res.restaurant_id === food.restaurant_id,
      );
      const foodDTO = await this.foodService.convertIntoFoodDTO(
        food,
        restaurant,
      );
      searchResult.byFoods.push(foodDTO);
    }

    //Fill up Restaurant data
    for (const restaurant of restaurants) {
      const menuItems = await restaurant.menu_items;
      const priceRange: PriceRange =
        await this.foodService.getPriceRangeByMenuItem(
          menuItems.map((item) => item.menu_item_id),
        );
      const restaurantDTO =
        await this.restaurantService.convertIntoRestaurantDTO(
          restaurant,
          priceRange,
        );
      searchResult.byRestaurants.push(restaurantDTO);
    }

    return searchResult;
  }
}
