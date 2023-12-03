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
import { SKU } from './sku.entity';
import { Media } from './media.entity';

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

  @Column({ type: 'time', nullable: true, unique: false })
  public cutoff_time: string;

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

  @Column({ type: 'int', nullable: false, unique: false })
  public image: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //Relations

  @ManyToOne(() => Restaurant, (res) => res.menu_items)
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  public restaurant: Restaurant;

  @OneToMany(() => MenuItemExt, (menuItemExt) => menuItemExt.menu_item)
  public menuItemExt: MenuItemExt[];

  @OneToMany(() => SKU, (sku) => sku.menu_item)
  public skus: SKU[];

  @ManyToOne(() => Media)
  @JoinColumn({
    name: 'image',
    referencedColumnName: 'media_id',
  })
  public image_obj: Media;
}
