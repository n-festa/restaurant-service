import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('Invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column({
    type: 'int',
  })
  payment_method: number;

  @Column({
    type: 'int',
  })
  total_amount: number;

  @Column({
    type: 'int',
  })
  tax_amount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  discount_amount: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'int',
  })
  order_id: number;

  @Column({
    type: 'int',
  })
  currency: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  payment_order_id: string | null;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
