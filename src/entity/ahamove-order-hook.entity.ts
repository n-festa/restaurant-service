import { PathLocation } from 'src/dependency/ahamove/dto/ahamove.hook';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Ahamove_Order_Hook')
export class AhamoveOrderHookEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  _id: string;

  @Column()
  accept_time: number;

  @Column()
  board_time: number;

  @Column({ default: false })
  cancel_by_user: boolean;

  @Column({ default: '' })
  cancel_comment: string;

  @Column({ default: '' })
  cancel_image_url: string;

  @Column()
  cancel_time: number;

  @Column()
  city_id: string;

  @Column()
  complete_time: number;

  @Column()
  create_time: number;

  @Column()
  currency: string;

  @Column()
  order_time: number;

  @Column()
  partner: string;

  // Map the 'path' property as a JSON column
  @Column('json')
  path: PathLocation[];

  @Column()
  payment_method: string;

  @Column()
  pickup_time: number;

  @Column()
  service_id: string;

  @Column()
  status: string;

  @Column()
  sub_status: string;

  @Column()
  supplier_id: string;

  @Column()
  supplier_name: string;

  @Column()
  surcharge: number;

  @Column()
  user_id: string;

  @Column()
  user_name: string;

  @Column()
  total_pay: number;

  @Column()
  promo_code: string;

  @Column()
  stoppoint_price: number;

  @Column()
  special_request_price: number;

  @Column()
  vat: number;

  @Column()
  distance_price: number;

  @Column()
  voucher_discount: number;

  @Column()
  subtotal_price: number;

  @Column()
  total_price: number;

  @Column()
  surge_rate: number;

  @Column()
  api_key: string;

  @Column()
  shared_link: string;

  @Column()
  insurance_portal_url: string;

  @Column()
  app: string;

  @Column()
  store_id: number;

  @Column()
  distance: number;
}
