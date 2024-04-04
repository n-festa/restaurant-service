export enum ResultType {
  FOOD = 'FOOD',
  RESTAURANT = 'RESTAURANT',
}
export enum SortType {
  RELEVANCE = 'RELEVANCE',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
}
export enum Filter {
  FROM_4STAR = 'FROM_4STAR',
  VEG = 'VEG',
  UPTO_500KCAL = 'UPTO_500KCAL',
}

enum IsoLangCode {
  VIE = 'vie',
  ENG = 'eng',
}

export class SearchFoodRequest {
  keyword: string; //REQUIRED
  ISO_language_code: IsoLangCode; //REQUIRED
  lat: string; //REQUIRED
  long: string; //REQUIRED
  result_type: ResultType; //REQUIRED - FOOD | RESTAURANT
  sort_type: SortType; //REQUIRED - RELEVANCE | PRICE_ASC | PRICE_DESC
  filter: Filter[]; //OPTIONAL - FROM_4STAR | VEG | UPTO_500KCAL
  offset: number; //REQUIRED
  page_size: number; //REQUIRED
  distance_limit_m: number; //OPTIONAL - DEFAULT: 10;000
  base_distance_for_grouping_m: number; //OPTIONAL - DEFAUL: 200
}
