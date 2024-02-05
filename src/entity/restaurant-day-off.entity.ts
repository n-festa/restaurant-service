import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('Restaurant_Day_Off')
export class RestaurantDayOff {
  @PrimaryGeneratedColumn()
  day_off_id: number;

  @Column({ type: 'date', nullable: false, unique: false })
  date: Date;

  @Column({ type: 'int', nullable: false, unique: false })
  restaurant_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
