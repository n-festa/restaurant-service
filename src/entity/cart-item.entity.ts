import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Packaging } from './packaging.entity';

@Entity('Cart_Item')
export class CartItem {
  @PrimaryGeneratedColumn()
  public item_id: number;

  @Column({ type: 'int', unique: false, nullable: false })
  public customer_id: number;

  @Column({ type: 'int', unique: false, nullable: false })
  public sku_id: number;

  @Column({ type: 'int', unique: false, nullable: true })
  public qty_ordered: number;

  @Column({ type: 'varchar', length: 255, unique: false, nullable: true })
  public advanced_taste_customization: string;

  @Column({ type: 'varchar', length: 255, unique: false, nullable: true })
  public basic_taste_customization: string;

  @Column({ type: 'varchar', length: 255, unique: false, nullable: true })
  public portion_customization: string;

  @Column({ type: 'text', unique: false, nullable: true })
  public advanced_taste_customization_obj: string;

  @Column({ type: 'text', unique: false, nullable: true })
  public basic_taste_customization_obj: string;

  @Column({ type: 'text', unique: false, nullable: true })
  public notes: string;

  @Column({ type: 'int', unique: false, nullable: true })
  public restaurant_id: number;

  @Column({ type: 'int', unique: false, nullable: true })
  public packaging_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @ManyToOne(() => Packaging)
  @JoinColumn({ name: 'packaging_id', referencedColumnName: 'packaging_id' })
  public packaging_obj: Packaging;
}
