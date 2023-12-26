import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { OrderSKU } from './order-sku.entity';
import { SkuMenuItemVariant } from './sku-menu-item-variant.entity';
import { SkuDiscount } from './sku-discount.entity';

@Entity('SKU')
export class SKU {
  @PrimaryGeneratedColumn()
  public sku_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_id: number;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: false })
  public sku: string;

  @Column({ type: 'int', nullable: false, unique: false })
  public price: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;
  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_standard: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public calorie_kcal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public protein_g: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public fat_g: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public carbohydrate_g: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONS
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.skus)
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  public menu_item: MenuItem;

  @OneToMany(() => OrderSKU, (orderSKU) => orderSKU.sku_obj)
  public order_sku_obj: OrderSKU[];

  @OneToMany(() => SkuMenuItemVariant, (variant) => variant.sku_obj)
  public menu_item_variants: SkuMenuItemVariant[];

  @OneToMany(() => SkuDiscount, (discount) => discount.sku_obj)
  public discount: SkuDiscount[];
}
