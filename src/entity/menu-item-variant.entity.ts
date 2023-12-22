import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { MenuItemVariantExt } from './menu-item-variant-ext.entity';
import { MenuItemVariantOpion } from './menu-item-variant-option.entity';
import { TasteExt } from './taste-ext.entity';

@Entity('Menu_Item_Variant')
export class MenuItemVariant {
  @PrimaryGeneratedColumn()
  public menu_item_variant_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public type: string;

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
  @OneToMany(
    () => MenuItemVariantExt,
    (menuItemVariantExt) => menuItemVariantExt.menu_item_variant_obj,
  )
  public menu_item_variant_ext_obj: MenuItemVariantExt[];

  @OneToMany(
    () => MenuItemVariantOpion,
    (option) => option.menu_item_variant_obj,
  )
  public options: MenuItemVariantOpion[];

  @OneToMany(() => TasteExt, (tasteExt) => tasteExt.taste)
  public taste_ext: TasteExt[];
}
