import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';
import { MessagePattern } from '@nestjs/microservices';
import { SearchByCategory } from './dto/search-by-category-request.dto';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern({ cmd: 'get_categories' })
  async getCategories() {
    return this.categoryService.getCategories();
  }

  @MessagePattern({ cmd: 'search_food_and_restaurant_by_category' })
  async searchFoodAndRestaurantByCategory(data: SearchByCategory) {
    return this.categoryService.searchFoodAndRestaurantByCategory(data);
  }
}
