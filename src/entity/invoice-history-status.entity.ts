import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
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
    type: 'int',
  })
  status: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  note: string | null;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
