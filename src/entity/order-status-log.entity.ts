import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { OrderStatus } from 'src/enum';

@Entity('Order_Status_Log')
export class OrderStatusLog {
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @Column({ type: 'int' })
  order_id: number;

  @Column({ type: 'varchar', length: 64 })
  order_status_id: OrderStatus;

  @Column('text', { nullable: true })
  note: string | null;

  @Column('bigint')
  logged_at: number;
}
