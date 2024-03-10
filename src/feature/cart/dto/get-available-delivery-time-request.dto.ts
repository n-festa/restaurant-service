export class GetAvailableDeliveryTimeRequest {
  menu_item_ids: number[];
  now: number;
  long: number;
  lat: number;
  utc_offset: number;
  having_advanced_customization: boolean;
}
