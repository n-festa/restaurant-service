import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { SKU } from './sku.entity';
import { FoodRating } from './food-rating.entity';
import { Packaging } from './packaging.entity';
import { Order } from './order.entity';

@Entity('Order_SKU')
export class OrderSKU {
  @PrimaryGeneratedColumn()
  public order_sku_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public order_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public sku_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public qty_ordered: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public price: number;

  // @Column({ type: 'int', nullable: false, unique: false })
  // public currency: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public advanced_taste_customization: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public basic_taste_customization: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public portion_customization: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public advanced_taste_customization_obj: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public basic_taste_customization_obj: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public notes: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public packaging_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public label_id: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public calorie_kcal: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP

  // @ManyToOne(() => Unit)
  // @JoinColumn({
  //   name: 'currency',
  //   referencedColumnName: 'unit_id',
  // })
  // public currency_obj: Unit;

  @ManyToOne(() => SKU, (sku) => sku.order_sku_obj)
  @JoinColumn({
    name: 'sku_id',
    referencedColumnName: 'sku_id',
  })
  public sku_obj: SKU;

  @OneToOne(() => FoodRating, (foodRating) => foodRating.order_sku_obj)
  public food_rating_obj: FoodRating;

  @ManyToOne(() => Packaging)
  @JoinColumn({
    name: 'packaging_id',
    referencedColumnName: 'packaging_id',
  })
  packaging_obj: Packaging;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({
    name: 'order_id',
    referencedColumnName: 'order_id',
  })
  public order_obj: Order;
}
