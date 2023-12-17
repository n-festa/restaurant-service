import { Controller, Inject } from '@nestjs/common';
import { SearchService } from './search.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { SearchFoodByNameRequest } from './dto/search-food-by-name-request.dto';
import { SearchResult } from 'src/dto/search-result.dto';

@Controller()
export class SearchController {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly searchService: SearchService,
  ) {}

  @MessagePattern({ cmd: 'search_food_by_name' })
  async searchFoodByName(data: SearchFoodByNameRequest): Promise<SearchResult> {
    if (this.flagService.isFeatureEnabled('fes-12-search-food-by-name')) {
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
    } else {
    }
  }
}
