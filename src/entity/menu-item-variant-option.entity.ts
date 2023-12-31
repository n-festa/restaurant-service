import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MenuItemVariant } from './menu-item-variant.entity';
import { Unit } from './unit.entity';
import { TasteValueExt } from './taste-value-ext.entity';

@Entity('Menu_Item_Variant_Option')
export class MenuItemVariantOpion {
  @PrimaryGeneratedColumn()
  public menu_item_variant_option_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_variant_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public value: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public unit: number;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public taste_value: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public note: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP

  @ManyToOne(
    () => MenuItemVariant,
    (menuItemVariant) => menuItemVariant.options,
  )
  @JoinColumn({
    name: 'menu_item_variant_id',
    referencedColumnName: 'menu_item_variant_id',
  })
  public menu_item_variant_obj: MenuItemVariant;

  @ManyToOne(() => Unit)
  @JoinColumn({
    name: 'unit',
    referencedColumnName: 'unit_id',
  })
  public unit_obj: Unit;

  @OneToMany(() => TasteValueExt, (ext) => ext.taste_value_obj)
  public taste_value_ext: TasteValueExt[];
}
