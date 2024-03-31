import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Order } from './order.entity';
import { Customer } from './customer.entity';

@Entity('Driver_Rating')
export class DriverRating {
  @PrimaryGeneratedColumn()
  driver_rating_id: number;

  @Column()
  driver_id: number;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column()
  order_id: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  score: number;

  @Column({ nullable: true })
  remarks: string;

  @Column()
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ default: 1 })
  is_active: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
