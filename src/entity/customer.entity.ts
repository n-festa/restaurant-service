import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from './media.entity';

@Entity('Customer')
export class Customer {
  @PrimaryGeneratedColumn()
  public customer_id: number;

  @Column({ type: 'varchar', length: 25, nullable: false, unique: true })
  public phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public email: string;

  @Column({ type: 'date', nullable: true, unique: false })
  public birthday: Date;

  @Column({ type: 'char', length: 1, nullable: true, unique: false })
  public sex: string;

  @OneToOne(() => Media)
  @JoinColumn({
    name: 'profile_image',
    referencedColumnName: 'media_id',
  })
  public profile_image: Media;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;

  // @OneToOne(() => HealthInfo)
  // @JoinColumn({
  //   name: 'health_info_id',
  //   referencedColumnName: 'health_info_id',
  // })
  // public health_info: HealthInfo;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public refresh_token: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
