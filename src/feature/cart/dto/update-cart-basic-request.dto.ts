export class UpdateCartBasicRequest {
  customer_id: number;
  updated_items: QuantityUpdatedItem[];
}
interface QuantityUpdatedItem {
  item_id: number;
  qty_ordered: number;
}
