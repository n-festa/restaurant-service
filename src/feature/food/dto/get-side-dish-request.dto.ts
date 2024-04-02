import { FetchMode } from 'src/enum';

export class GetSideDishRequest {
  menu_item_id: number;
  timestamp: number;
  fetch_mode: FetchMode;
}
