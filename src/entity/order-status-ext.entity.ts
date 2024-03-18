import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatusLog } from './order-status-log.entity';

@Entity('Order_Status_Ext')
export class OrderStatusExt {
  @PrimaryColumn()
  public order_status_id: string;
  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'text', nullable: false, unique: false })
  public description: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //Relationship
  @ManyToOne(() => OrderStatusLog, (log) => log.order_status_ext)
  @JoinColumn({
    name: 'order_status_id',
    referencedColumnName: 'order_status_id',
  })
  public order_status_log_obj: OrderStatusLog;
}
