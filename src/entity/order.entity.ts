import { OrderStatus } from 'src/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'Order' })
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @Column({ type: 'int', nullable: false })
  restaurant_id: number;

  @Column({ type: 'int', nullable: false })
  address_id: number;

  @Column({ type: 'int', nullable: true })
  driver_id: number;

  @Column({ type: 'int', nullable: false })
  order_total: number;

  @Column({ type: 'int', nullable: false })
  delivery_fee: number;

  @Column({ type: 'int', nullable: false })
  packaging_fee: number;

  @Column({ type: 'int', nullable: false })
  cutlery_fee: number;

  @Column({ type: 'int', nullable: false })
  app_fee: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  coupon_value_from_platform: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  coupon_value_from_restaurant: number;

  @Column({ type: 'int', nullable: true, default: null })
  coupon_id: number;

  @Column({ type: 'int', nullable: false })
  currency: number;

  @Column({ type: 'tinyint', nullable: false, default: '0' })
  is_preorder: boolean;

  @Column({ type: 'bigint', nullable: true })
  expected_arrival_time: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  delivery_order_id: string;

  // @Column({ type: 'bigint', nullable: true })
  // confirm_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // processing_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // driver_accept_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // driver_cancel_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // ready_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // pickup_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // completed_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // fail_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // return_time: number;

  // @Column({ type: 'bigint', nullable: true })
  // cancel_time: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driver_note: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
