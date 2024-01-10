import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItemAttribute } from './menu-item-attribute.entity';

@Entity('Menu_Item_Attribute_Ext')
export class MenuItemAttributeExt {
  @PrimaryColumn()
  public attribute_id: number;

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
    () => MenuItemAttribute,
    (attribute) => attribute.menu_item_attribute_ext_obj,
  )
  @JoinColumn({
    name: 'attribute_id',
    referencedColumnName: 'attribute_id',
  })
  public menu_item_attribute_obj: MenuItemAttribute;
}
