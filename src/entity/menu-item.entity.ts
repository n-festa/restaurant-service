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
import { Recipe } from './recipe.entity';
import { MenuItemPackaging } from './menuitem-packaging.entity';
import { MenuItemAttribute } from './menu-item-attribute.entity';

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

  // @Column({ type: 'time', nullable: true, unique: false })
  // public cutoff_time: string;

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

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public rating: number;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: false })
  ingredient_brief_vie: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: false })
  ingredient_brief_eng: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public promotion: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public units_sold: number;

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

  @OneToMany(() => Recipe, (recipe) => recipe.menu_item)
  public recipe: Promise<Recipe[]>;

  @OneToMany(
    () => MenuItemPackaging,
    (menuItemPackaging) => menuItemPackaging.menu_item_obj,
  )
  public menuItemPackaging_obj: MenuItemPackaging[];

  @OneToMany(() => MenuItemAttribute, (att) => att.menu_item_obj)
  public attribute_obj: MenuItemAttribute[];
}
