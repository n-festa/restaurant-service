import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('Operation_Hours')
export class OperationHours {
  @PrimaryGeneratedColumn()
  ops_hour_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  day_of_week: number;

  @Column({ type: 'time', nullable: false, unique: false })
  from_time: string;

  @Column({ type: 'time', nullable: false, unique: false })
  to_time: string;

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
