import { GeneralResponse } from 'src/dto/general-response.dto';

export interface GetReviewFormResponse {
  customer_id: number;
  order_id: number;
  order_date: number;
  driver_id: number;
  order_items: OrderItem[];
}
interface OrderItem {
  order_sku_id: number;
  name: TextByLang[];
  price: number;
  advanced_taste_customization: string;
  basic_taste_customization: string;
  portion_customization: string;
}
interface TextByLang {
  ISO_language_code: string;
  text: string;
}

export class GetpReviewFormResponse extends GeneralResponse {
  data: GetReviewFormResponse;
}
