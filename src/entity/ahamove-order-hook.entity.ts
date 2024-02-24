import { PathLocation } from 'src/dependency/ahamove/dto/ahamove.hook';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Ahamove_Order_Hook')
export class AhamoveOrderHookEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  _id: string;

  @Column({ nullable: true })
  accept_time: number;

  @Column({ nullable: true })
  board_time: number;

  @Column({ default: false })
  cancel_by_user: boolean;

  @Column({ default: '' })
  cancel_comment: string;

  @Column({ default: '' })
  cancel_image_url: string;

  @Column({ nullable: true })
  cancel_time: number;

  @Column({ nullable: true })
  city_id: string;

  @Column({ nullable: true })
  complete_time: number;

  @Column({ nullable: true })
  create_time: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  order_time: number;

  @Column({ nullable: true })
  partner: string;

  // Map the 'path' property as a JSON column
  @Column('json')
  path: PathLocation[];

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  pickup_time: number;

  @Column({ nullable: true })
  service_id: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  sub_status: string;

  @Column({ nullable: true })
  supplier_id: string;

  @Column({ nullable: true })
  supplier_name: string;

  @Column({ nullable: true })
  surcharge: number;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  total_pay: number;

  @Column({ nullable: true })
  promo_code: string;

  stoppoint_price: number;

  @Column({ nullable: true })
  special_request_price: number;

  @Column({ nullable: true })
  vat: number;

  @Column({ nullable: true })
  distance_price: number;

  @Column({ nullable: true })
  voucher_discount: number;

  @Column({ nullable: true })
  subtotal_price: number;

  @Column({ nullable: true })
  total_price: number;

  @Column({ nullable: true })
  surge_rate: number;

  @Column({ nullable: true })
  api_key: string;

  @Column({ nullable: true })
  shared_link: string;

  @Column({ nullable: true })
  insurance_portal_url: string;

  @Column({ nullable: true })
  app: string;

  @Column({ nullable: true })
  store_id: number;

  @Column({ nullable: true })
  distance: number;
}
