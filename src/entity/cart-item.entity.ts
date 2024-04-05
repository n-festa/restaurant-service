import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Packaging } from './packaging.entity';
import { SKU } from './sku.entity';

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

  @Column({
    type: 'json',
    unique: false,
    nullable: false,
    transformer: {
      // used to deserialize your data from db field value
      from(val: object) {
        return JSON.stringify(val);
      },
      // used to serialize your data to db field
      to(val) {
        return val;
      },
    },
  })
  public advanced_taste_customization_obj: string;

  @Column({
    type: 'json',
    unique: false,
    nullable: false,
    transformer: {
      // used to deserialize your data from db field value
      from(val: object) {
        return JSON.stringify(val);
      },
      // used to serialize your data to db field
      to(val) {
        return val;
      },
    },
  })
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

  @ManyToOne(() => SKU)
  @JoinColumn({ name: 'sku_id', referencedColumnName: 'sku_id' })
  public sku_obj: SKU;
}
