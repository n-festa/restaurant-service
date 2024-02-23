import { OrderStatus } from 'src/enum';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'Order' })
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column()
  order_total: number;

  @Column()
  delivery_fee: number;

  @Column()
  packaging_fee: number;

  @Column()
  cutlery_fee: number;

  @Column()
  app_fee: number;

  @Column({ default: '0' })
  coupon_value_from_platform: number;

  @Column({ default: '0' })
  coupon_value_from_restaurant: number;

  @Column({ nullable: true })
  coupon_id?: number;

  @Column()
  currency: number;

  @Column({ default: '0' })
  is_preorder: boolean;

  @Column()
  payment_method: number;

  @Column({ nullable: true })
  expected_arrival_time?: number;

  @Column({ nullable: true })
  delivery_order_id?: string;

  @Column({ nullable: true })
  confirm_time?: number;

  @Column({ nullable: true })
  processing_time?: number;

  @Column({ nullable: true })
  driver_accept_time?: number;

  @Column({ nullable: true })
  driver_cancel_time?: number;

  @Column({ nullable: true })
  ready_time?: number;

  @Column({ nullable: true })
  pickup_time?: number;

  @Column({ nullable: true })
  completed_time?: number;

  @Column({ nullable: true })
  fail_time?: number;

  @Column({ nullable: true })
  return_time?: number;

  @Column({ nullable: true })
  cancel_time?: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  //TODO Add other relations...
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  order_status_id: OrderStatus;
}
