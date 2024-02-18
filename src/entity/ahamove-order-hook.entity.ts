import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  _id: string;

  @Column()
  accept_time: Date;

  @Column()
  board_time: Date;

  @Column({ default: false })
  cancel_by_user: boolean;

  @Column({ default: '' })
  cancel_comment: string;

  @Column({ default: '' })
  cancel_image_url: string;

  @Column()
  cancel_time: Date;

  @Column()
  city_id: string;

  @Column()
  complete_time: Date;

  @Column()
  create_time: Date;

  @Column()
  currency: string;

  @Column()
  order_time: Date;

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
