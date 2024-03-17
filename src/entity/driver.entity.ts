import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Media } from './media.entity';

@Entity('Driver')
export class Driver {
  @PrimaryGeneratedColumn()
  driver_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  name: string;

  @Column({ type: 'varchar', length: 25, nullable: true, unique: false })
  phone_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  vehicle: string | null;

  @Column({ type: 'varchar', length: 48, nullable: true, unique: false })
  license_plates: string | null;

  @Column({
    type: 'enum',
    enum: ['AHAMOVE', 'ONWHEEL'],
    nullable: true,
  })
  type: 'AHAMOVE' | 'ONWHEEL' | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  reference_id: string;

  @Column({ type: 'int', nullable: true, unique: false })
  profile_image: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @ManyToOne(() => Media)
  @JoinColumn({
    name: 'profile_image',
    referencedColumnName: 'media_id',
  })
  profile_image_obj: Media;
}
