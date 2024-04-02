import { FetchMode } from 'src/enum';

export class GetSimilarFoodRequest {
  menu_item_id: number;
  fetch_mode: FetchMode;
}
