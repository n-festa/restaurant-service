import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('Media')
export class Media {
  @PrimaryGeneratedColumn()
  public media_id: number;

  @Column({ type: 'varchar', length: 45, nullable: false, unique: false })
  public type: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public name: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public description: string;

  @Column({ type: 'varchar', length: 2048, nullable: false, unique: false })
  public url: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public restaurant_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public menu_item_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public packaging_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public driver_rating_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public food_rating_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
