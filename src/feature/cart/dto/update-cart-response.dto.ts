import { GeneralResponse } from 'src/dto/general-response.dto';

export class UpdateCartResponse extends GeneralResponse {
  data: CartDetail;
}

interface CartDetail {
  customer_id: number;
  cart_info: CartItem[];
}

interface CartItem {
  item_id: number;
  sku_id: number;
  customer_id: number;
  qty_ordered: number;
  advanced_taste_customization: string;
  basic_taste_customization: string;
  portion_customization: string;
  advanced_taste_customization_obj: string;
  basic_taste_customization_obj: string;
  notes: string;
  restaurant_id: number;
  created_at: Date;
}
