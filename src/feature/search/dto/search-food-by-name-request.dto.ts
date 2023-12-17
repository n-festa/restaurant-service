export class SearchFoodByNameRequest {
  keyword: string;
  ISO_language_code: string;
  lat: number;
  long: number;
  record_offset: number;
  page_size: number;
  distance_offset_m: number;
  distance_limit_m: number;
  base_distance_for_grouping_m: number;
}
