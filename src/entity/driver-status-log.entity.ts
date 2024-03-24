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

  @Column({ type: 'int', nullable: false, unique: false })
  order_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  driver_id: number | null;

  @Column('text', { nullable: true, unique: false })
  note: string | null;

  @Column('bigint')
  logged_at: number;

  //RELATIONSHIP
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  order: Order;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id', referencedColumnName: 'driver_id' })
  driver: Driver | null;
}
