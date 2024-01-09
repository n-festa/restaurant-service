import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SKU } from './sku.entity';
import { MenuItemAttribute } from './menu-item-attribute.entity';
import { MenuItemVariantOpion } from './menu-item-variant-option.entity';

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

  @ManyToOne(() => MenuItemAttribute)
  @JoinColumn({
    name: 'variant',
    referencedColumnName: 'attribute_id',
  })
  public attribute: MenuItemAttribute;

  @ManyToOne(() => MenuItemVariantOpion)
  @JoinColumn({
    name: 'option',
    referencedColumnName: 'menu_item_variant_option_id',
  })
  public value: MenuItemVariantOpion;
}
