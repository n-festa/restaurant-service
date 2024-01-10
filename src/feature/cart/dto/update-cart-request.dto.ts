export class UpdateCartRequest {
  customer_id: number;
  updated_items: UpdatedCartItem[];
  lang?: string;
}

interface UpdatedCartItem {
  item_id: number;
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
}

interface OptionSelection {
  option_id: string;
  value_id: string;
}

interface BasicTasteSelection {
  no_adding_id: string;
}
