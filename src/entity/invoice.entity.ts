import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { InvoiceStatusHistory } from './invoice-history-status.entity';
import { PaymentOption } from './payment-option.entity';

@Entity('Invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  payment_method: number;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  total_amount: number;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  tax_amount: number;

  @Column({
    type: 'int',
    default: 0,
    nullable: false,
    unique: false,
  })
  discount_amount: number;

  @Column({
    type: 'text',
    nullable: true,
    unique: false,
  })
  description: string | null;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  order_id: number;

  @Column({
    type: 'int',
    nullable: false,
    unique: false,
  })
  currency: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: false,
  })
  payment_order_id: string | null;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  //RELATIONSHIP
  @OneToOne(() => Order, (order) => order.invoice_obj)
  @JoinColumn({
    name: 'order_id',
    referencedColumnName: 'order_id',
  })
  public order_obj: Order;

  @OneToMany(() => InvoiceStatusHistory, (history) => history.invoice_obj)
  public history_status_obj: InvoiceStatusHistory[];

  @ManyToOne(() => PaymentOption)
  @JoinColumn({
    name: 'payment_method',
    referencedColumnName: 'option_id',
  })
  public payment_option_obj: PaymentOption;
}
