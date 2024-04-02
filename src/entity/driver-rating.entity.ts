import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Order } from './order.entity';
import { Customer } from './customer.entity';

@Entity('Driver_Rating')
export class DriverRating {
  @PrimaryGeneratedColumn()
  driver_rating_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  driver_id: number;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id', referencedColumnName: 'driver_id' })
  driver: Driver;

  @Column({ type: 'int', nullable: false, unique: false })
  order_id: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  order: Order;

  @Column({ type: 'tinyint', nullable: false, unique: false })
  score: number;

  @Column({ type: 'text', nullable: true, unique: false })
  remarks: string;

  @Column({ type: 'int', nullable: false, unique: false })
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'customer_id' })
  customer: Customer;

  @Column({ type: 'tinyint', nullable: false, unique: false, default: 1 })
  is_active: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
