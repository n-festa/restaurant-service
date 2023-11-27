import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from './media.entity';

@Entity('Restaurant_Owner')
export class RestaurantOwner {
  @PrimaryGeneratedColumn()
  public restaurant_owner_id: number;

  @Column({ type: 'varchar', length: 25, nullable: false, unique: true })
  public phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public email: string;

  @OneToOne(() => Media)
  @JoinColumn({
    name: 'profile_image',
    referencedColumnName: 'media_id',
  })
  public profile_image: Media;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public username: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public password: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;

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
