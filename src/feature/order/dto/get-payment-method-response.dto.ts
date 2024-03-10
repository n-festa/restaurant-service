export class GetPaymentMethodResponse {
  data: Payment[];
}
interface Payment {
  payment_id: number;
  name: string;
}
