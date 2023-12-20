import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItemVariant } from './menu-item-variant.entity';

@Entity('Menu_Item_Variant_Ext')
export class MenuItemVariantExt {
  @PrimaryColumn()
  public menu_item_variant_id: number;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public name: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(
    () => MenuItemVariant,
    (menu_item_variant) => menu_item_variant.menu_item_variant_ext_obj,
  )
  @JoinColumn({
    name: 'menu_item_variant_id',
    referencedColumnName: 'menu_item_variant_id',
  })
  public menu_item_variant_obj: MenuItemVariant;
}
