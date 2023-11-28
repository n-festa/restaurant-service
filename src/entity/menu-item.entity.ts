import {
  Entity,
  CreateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuItemExt } from './menu-item-ext.entity';

@Entity('Menu_Item')
export class MenuItem {
  @PrimaryGeneratedColumn()
  public menu_item_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public restaurant_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public preparing_time_s: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public cooking_time_s: number;

  @Column({ type: 'datetime', nullable: true, unique: false })
  public cutoff_time: Date;

  @Column({ type: 'int', nullable: true, unique: false })
  public quantity_available: number;

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
  public is_vegetarian: number;

  @Column({ type: 'varchar', length: 22, nullable: false, unique: false })
  public cooking_schedule: string;

  @Column({ type: 'int', nullable: false, unique: false })
  public res_category_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //Relations

  @ManyToOne(() => Restaurant)
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  public restaurant: Restaurant;

  @OneToMany(() => MenuItemExt, (menuItemExt) => menuItemExt.menu_item)
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  public menuItemExt: MenuItemExt[];
}
