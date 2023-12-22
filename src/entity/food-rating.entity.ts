import {
  Entity,
  CreateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { OrderSKU } from './order-sku.entity';

@Entity('Food_Rating')
export class FoodRating {
  @PrimaryGeneratedColumn()
  public food_rating_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public order_sku_id: number;

  @Column({ type: 'tinyint', nullable: false, unique: false })
  public score: number;

  @Column({ type: 'text', nullable: true, unique: false })
  public remarks: string;

  @Column({ type: 'int', nullable: false, unique: false })
  public customer_id: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 1,
  })
  public is_active: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @OneToOne(() => OrderSKU, (order_sku) => order_sku.food_rating_obj)
  @JoinColumn({
    name: 'order_sku_id',
    referencedColumnName: 'order_sku_id',
  })
  public order_sku_obj: OrderSKU;
}
