import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from 'src/enum';
import { Order } from './order.entity';
import { OrderStatusExt } from './order-status-ext.entity';

@Entity('Order_Status_Log')
export class OrderStatusLog {
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @Column({ type: 'int', nullable: false, unique: false })
  order_id: number;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  order_status_id: OrderStatus;

  @Column('text', { nullable: true, unique: false })
  note: string | null;

  @Column('bigint')
  logged_at: number;

  //RELATIONSHIP
  @ManyToOne(() => Order, (order) => order.order_status_log)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  public order_obj: Order;

  @OneToMany(() => OrderStatusExt, (ext) => ext.order_status_log_obj)
  public order_status_ext: OrderStatusExt[];
}
