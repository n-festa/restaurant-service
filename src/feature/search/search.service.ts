import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async searchFoodByName(
    keyword: string,
    ISO_language_code: string,
    lat: number,
    long: number,
    record_offset: number,
    page_size: number,
    distance_offset_m: number,
    distance_limit_m: number,
    base_distance_for_grouping_m: number,
  ) {
    if (this.flagService.isFeatureEnabled('fes-12-search-food-by-name')) {
      const rawData = await this.entityManager.query(
        `SELECT food_search.menu_item_id, food_search.restaurant_id, calculate_distance(${lat}, ${long}, food_search.latitude, food_search.longitude, ${base_distance_for_grouping_m}) AS distance, MATCH (food_search.name , food_search.short_name) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE) AS score FROM Food_Search AS food_search Where food_search.ISO_language_code = '${ISO_language_code}' GROUP BY menu_item_id HAVING distance > ${distance_offset_m} AND distance <= ${distance_limit_m} AND score > 0 ORDER BY distance ASC , score DESC LIMIT ${page_size} OFFSET ${record_offset}`,
      );
      return rawData;
    } else {
    }
  }
}
