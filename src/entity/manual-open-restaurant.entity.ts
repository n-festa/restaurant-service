import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('Manual_Open_Restaurant')
export class ManualOpenRestaurant {
  @PrimaryGeneratedColumn()
  manual_id: number;

  @Column({ type: 'date', nullable: true, unique: false })
  date: Date;

  @Column({ type: 'datetime', nullable: true, unique: false })
  from_time: Date;

  @Column({ type: 'datetime', nullable: true, unique: false })
  to_time: Date;

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
