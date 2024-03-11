import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Driver } from './driver.entity';

@Entity('Driver_Status_Log')
export class DriverStatusLog {
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @Column()
  order_id: number;

  @Column({ nullable: true })
  driver_id: number | null;

  @Column('text', { nullable: true })
  note: string | null;

  @Column('bigint')
  logged_at: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver | null;
}
