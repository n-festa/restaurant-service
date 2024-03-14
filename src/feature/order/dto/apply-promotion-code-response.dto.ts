export class ApplyPromotionCodeResponse {
  discount_amount: number;
  currency: string;
  coupon_code: string;
  restaurant_id: number;
  items: CouponAppliedItem[];
}
interface CouponAppliedItem {
  sku_id: number;
  qty_ordered: number;
  price_after_discount: number;
  packaging_price: number;
}
