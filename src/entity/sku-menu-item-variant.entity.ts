import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SKU } from './sku.entity';
import { MenuItemVariant } from './menu-item-variant.entity';

@Entity('SKU_Menu_Item_Variant')
export class SkuMenuItemVariant {
  @PrimaryColumn()
  public sku_id: number;

  @PrimaryColumn()
  public variant: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public option: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(() => SKU, (sku) => sku.menu_item_variants)
  @JoinColumn({
    name: 'sku_id',
    referencedColumnName: 'sku_id',
  })
  public sku_obj: SKU;

  @ManyToOne(() => MenuItemVariant)
  @JoinColumn({
    name: 'variant',
    referencedColumnName: 'menu_item_variant_id',
  })
  public attribute: MenuItemVariant;
}
