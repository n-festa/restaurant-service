import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatusLog } from './order-status-log.entity';
import { Invoice } from './invoice.entity';
import { OrderSKU } from './order-sku.entity';
import { Address } from './address.entity';

@Entity({ name: 'Order' })
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  customer_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  restaurant_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  address_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  order_total: number;

  @Column({ type: 'int', nullable: false, unique: false })
  delivery_fee: number;

  @Column({ type: 'int', nullable: false, unique: false })
  packaging_fee: number;

  @Column({ type: 'int', nullable: false, unique: false })
  cutlery_fee: number;

  @Column({ type: 'int', nullable: false, unique: false })
  app_fee: number;

  @Column({ type: 'int', nullable: false, default: 0, unique: false })
  coupon_value_from_platform: number;

  @Column({ type: 'int', nullable: false, default: 0, unique: false })
  coupon_value_from_restaurant: number;

  @Column({ type: 'int', nullable: true, default: null, unique: false })
  coupon_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  currency: number;

  @Column({ type: 'tinyint', nullable: false, default: '0', unique: false })
  is_preorder: number;

  @Column({ type: 'bigint', nullable: true, unique: false })
  expected_arrival_time: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  delivery_order_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  driver_note: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  //RELATIONSHIP

  @OneToMany(() => OrderStatusLog, (status) => status.order_obj)
  public order_status_log: OrderStatusLog[];

  @OneToOne(() => Invoice, (invoice) => invoice.order_obj)
  public invoice_obj: Invoice;

  @OneToMany(() => OrderSKU, (item) => item.order_obj)
  public items: OrderSKU[];

  @ManyToOne(() => Address)
  @JoinColumn({
    name: 'address_id',
    referencedColumnName: 'address_id',
  })
  public address_obj: Address;
}
