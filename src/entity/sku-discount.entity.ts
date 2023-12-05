import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('SKU_Discount')
export class SkuDiscount {
  @PrimaryGeneratedColumn()
  public sku_discount_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public sku_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public discount_value: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public discount_unit: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;

  @Column({ type: 'datetime', nullable: false, unique: false })
  public valid_from: Date;

  @Column({ type: 'datetime', nullable: false, unique: false })
  public valid_until: Date;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @ManyToOne(() => Unit, { eager: true })
  @JoinColumn({
    name: 'discount_unit',
    referencedColumnName: 'unit_id',
  })
  discount_unit_obj: Unit;
}
