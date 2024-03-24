import {
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceStatusHistory } from './invoice-history-status.entity';

@Entity('Invoice_Status_Ext')
export class InvoiceStatusExt {
  @PrimaryColumn()
  public status_id: string;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public name: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @ManyToOne(
    () => InvoiceStatusHistory,
    (history) => history.invoice_status_ext,
  )
  @JoinColumn({
    name: 'status_id',
    referencedColumnName: 'status_id',
  })
  public invoice_status_history: InvoiceStatusHistory;
}
