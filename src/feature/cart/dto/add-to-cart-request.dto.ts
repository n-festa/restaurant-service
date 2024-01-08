export class AddToCartRequest {
  customer_id: number;
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: OptionSelection[];
  notes: string;
  lang?: string;
}

interface OptionSelection {
  option_id: string;
  value_id: string;
}
