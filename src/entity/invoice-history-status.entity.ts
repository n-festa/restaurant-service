import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('Invoice_Status_History')
export class InvoiceStatusHistory {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  status_history_id: string;

  @Column({
    type: 'int',
  })
  invoice_id: number;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  status_id: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  note: string | null;

  @Column({ type: 'bigint', nullable: false })
  created_at: number;
}
