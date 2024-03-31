import { FetchMode } from 'src/enum';

export class GetAvailableFoodByRestaurantRequest {
  menu_item_id: number;
  fetch_mode: FetchMode;
}
