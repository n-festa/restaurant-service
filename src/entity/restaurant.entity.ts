import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Address } from './address.entity';
import { RestaurantOwner } from './restaurant-owner.entity';
import { Media } from './media.entity';
import { RestaurantExt } from './restaurant-ext.entity';
import { MenuItem } from './menu-item.entity';
import { Unit } from './unit.entity';

@Entity('Restaurant')
export class Restaurant {
  @PrimaryGeneratedColumn()
  public restaurant_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public address_id: number;

  @Column({ type: 'varchar', length: 25, nullable: false, unique: false })
  public phone_number: string;

  @ManyToOne(() => RestaurantOwner, { eager: true })
  @JoinColumn({
    name: 'restaurant_owner_id',
    referencedColumnName: 'restaurant_owner_id',
  })
  public restaurant_owner: RestaurantOwner;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_auto_confirmed: number;

  @OneToOne(() => Media, { eager: true })
  @JoinColumn({
    name: 'logo',
    referencedColumnName: 'media_id',
  })
  public logo: Media;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: false })
  public bank_name: string;

  @Column({ type: 'varchar', length: 11, nullable: true, unique: false })
  public bin: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: false })
  public account_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public account_owner_name: string;

  @Column({ type: 'varchar', length: 2048, nullable: true, unique: false })
  public shared_link: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public intro_video: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public rating: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public review_total_count: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public top_food: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public promotion: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public unit: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 0,
    nullable: true,
    unique: false,
  })
  public utc_time_zone: number;

  @Column({ type: 'int', nullable: false, unique: false, default: 0 })
  public cutoff_time_m: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public cutlery_price: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @OneToMany(() => RestaurantExt, (restaurantExt) => restaurantExt.restaurant, {
    eager: true,
  })
  public restaurant_ext: RestaurantExt[];

  @ManyToOne(() => Media, { eager: true })
  @JoinColumn({
    name: 'intro_video',
    referencedColumnName: 'media_id',
  })
  public intro_video_obj: Media;

  @OneToMany(() => MenuItem, (item) => item.restaurant)
  public menu_items: Promise<MenuItem[]>;

  @ManyToOne(() => Unit, { eager: true })
  @JoinColumn({
    name: 'unit',
    referencedColumnName: 'unit_id',
  })
  public unit_obj: Unit;

  @OneToOne(() => Address, { eager: true })
  @JoinColumn({
    name: 'address_id',
    referencedColumnName: 'address_id',
  })
  public address: Address;
}
