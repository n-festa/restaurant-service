import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { MenuItemAttributeExt } from './menu-item-attribute-ext.entity';
import { MenuItemAttributeValue } from './menu-item-attribute-value.entity';
import { TasteExt } from './taste-ext.entity';

@Entity('Menu_Item_Attribute')
export class MenuItemAttribute {
  @PrimaryGeneratedColumn()
  public attribute_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public type_id: string;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public taste_id: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS
  @OneToMany(() => MenuItemAttributeExt, (ext) => ext.menu_item_attribute_obj)
  public menu_item_attribute_ext_obj: MenuItemAttributeExt[];

  @OneToMany(() => MenuItemAttributeValue, (value) => value.attribute_obj)
  public values: MenuItemAttributeValue[];

  @OneToMany(() => TasteExt, (tasteExt) => tasteExt.taste)
  public taste_ext: TasteExt[];
}
