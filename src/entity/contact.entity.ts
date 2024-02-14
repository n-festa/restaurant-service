import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('Contact')
export class Contact {
  @PrimaryGeneratedColumn()
  contact_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  email: string;

  @Column({ type: 'longtext', nullable: false, unique: false })
  content: string;

  @Column({ type: 'tinyint', nullable: true, unique: false })
  is_contacted: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
