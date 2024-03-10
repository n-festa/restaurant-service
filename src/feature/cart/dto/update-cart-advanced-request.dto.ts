export class UpdateCartAdvancedRequest {
  customer_id: number;
  item_id: number;
  sku_id: number;
  qty_ordered: number;
  advanced_taste_customization_obj: OptionSelection[];
  basic_taste_customization_obj: BasicTasteSelection[];
  notes: string;
  lang?: string;
  packaging_id?: number;
}

interface OptionSelection {
  option_id: string;
  value_id: string;
}

interface BasicTasteSelection {
  no_adding_id: string;
}
