import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceStatusExt } from './invoice-status-ext.entity';

@Entity('Invoice_Status_History')
export class InvoiceStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  status_history_id: string;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  invoice_id: number;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: false,
  })
  status_id: string | null;

  @Column({
    type: 'text',
    nullable: true,
    unique: false,
  })
  note: string | null;

  @Column({ type: 'bigint', nullable: false, unique: false })
  created_at: number;

  //RELATIONSHIP
  @ManyToOne(() => Invoice, (invoice) => invoice.history_status_obj)
  @JoinColumn({
    name: 'invoice_id',
    referencedColumnName: 'invoice_id',
  })
  public invoice_obj: Invoice;

  @OneToMany(() => InvoiceStatusExt, (ext) => ext.invoice_status_history)
  public invoice_status_ext: InvoiceStatusExt[];
}
