export interface MomoRequestDTO {
  amount: string;
  extraData: string;
  orderId: number;
  momoOrderId: string;
  orderInfo: string;
}

export interface MomoRequest {
  accessKey: string;
  amount: string;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
}
