export class GetCouponInfoResponse {
  coupons: CouponInfo[];
}

interface CouponInfo {
  coupon_code: string;
  name: string;
  description: string;
}
