import { Controller, Inject, UseFilters } from '@nestjs/common';
import { SearchService } from './search.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { SearchFoodByNameRequest } from './dto/search-food-by-name-request.dto';
import { SearchResult } from 'src/dto/search-result.dto';
import {
  ResultType,
  SearchFoodRequest,
  SortType,
} from './dto/search-food-request.dto';
import {
  SearchFoodResponse,
  FoodDTO as SearchFoodDTO,
  SrestaurantDTO as SearchRestaurantDTO,
} from './dto/search-food-response.dto';
import { CustomRpcExceptionFilter } from 'src/filters/custom-rpc-exception.filter';

@Controller()
export class SearchController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly searchService: SearchService,
  ) {}

  @MessagePattern({ cmd: 'search_food_by_name' })
  async searchFoodByName(data: SearchFoodByNameRequest): Promise<SearchResult> {
    return await this.searchService.searchFoodByName(
      data.keyword,
      data.ISO_language_code,
      data.lat,
      data.long,
      data.record_offset,
      data.page_size,
      data.distance_offset_m,
      data.distance_limit_m,
      data.base_distance_for_grouping_m,
    );

    //CURRENT LOGIC
  }

  @MessagePattern({ cmd: 'search_food' })
  @UseFilters(new CustomRpcExceptionFilter())
  async searchFood(data: SearchFoodRequest): Promise<SearchFoodResponse> {
    const {
      keyword,
      ISO_language_code,
      lat,
      long,
      result_type,
      sort_type,
      filter = [],
      offset,
      page_size,
      distance_limit_m = 10000,
      base_distance_for_grouping_m = 200,
    } = data;

    const fullResult: SearchFoodDTO[] | SearchRestaurantDTO[] =
      await this.searchService.searchFoodInGeneral(
        keyword.trim(),
        ISO_language_code,
        Number(lat),
        Number(long),
        distance_limit_m,
        base_distance_for_grouping_m,
        result_type,
        filter,
      );

    //Sort the result based on the sort type
    if (result_type == ResultType.FOOD) {
      switch (sort_type) {
        case SortType.RELEVANCE:
          //Do nothing
          break;
        case SortType.PRICE_ASC:
          fullResult.sort((a, b) => a.price - b.price);
          break;
        case SortType.PRICE_DESC:
          fullResult.sort((a, b) => b.price - a.price);
          break;

        default:
          break;
      }
    }

    //Filter with the offset & page_size
    const finalResult = fullResult.slice(offset, page_size);

    const result: SearchFoodResponse = {
      results: finalResult,
      keyword: keyword,
      ISO_language_code: ISO_language_code,
      lat: lat,
      long: long,
      result_type: result_type,
      sort_type: sort_type,
      filter: filter,
      offset: offset + finalResult.length,
      total: fullResult.length,
      distance_limit_m: distance_limit_m,
      base_distance_for_grouping_m: base_distance_for_grouping_m,
    };

    return result;
  }
}
