import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('Driver')
export class Driver {
  @PrimaryGeneratedColumn()
  driver_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 25, nullable: true })
  phone_number: string | null;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ length: 255, nullable: true })
  vehicle: string | null;

  @Column({ length: 48, nullable: true })
  license_plates: string | null;

  @Column({
    type: 'enum',
    enum: ['AHAMOVE', 'ONWHEEL'],
    nullable: true,
  })
  type: 'AHAMOVE' | 'ONWHEEL' | null;

  @Column({ length: 255, nullable: true })
  reference_id: string;

  @Column({ nullable: true })
  profile_image: string;

  @CreateDateColumn()
  created_at: Date;
}
