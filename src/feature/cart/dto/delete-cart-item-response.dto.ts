import { GeneralResponse } from 'src/dto/general-response.dto';
import { TextByLang } from 'src/type';

export class DeleteCartItemResponse extends GeneralResponse {
  data: Data;
}
interface Data {
  customer_id: number;
  restaurant_id: number;
  restaurant_name: TextByLang[];
  restaurant_logo_img: string;
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
