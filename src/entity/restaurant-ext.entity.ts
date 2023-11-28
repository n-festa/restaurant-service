import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('Restaurant_Ext')
export class RestaurantExt {
  @PrimaryColumn()
  public restaurant_id: number;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public specialty: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public introduction: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.restaurant_ext)
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  public restaurant: Restaurant;
}
