import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('Menu_Item_Ext')
export class MenuItemExt {
  @PrimaryColumn()
  public menu_item_id: number;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public short_name: string;

  @Column({ type: 'text', nullable: false, unique: false })
  public description: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public main_cooking_method: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.menuItemExt)
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  public menu_item: MenuItem;
}
