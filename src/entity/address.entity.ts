import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('Address')
export class Address {
  @PrimaryGeneratedColumn()
  public address_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public address_line: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public ward: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public district: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public city: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: false })
  public country: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 6,
    nullable: false,
    unique: false,
  })
  public latitude: number;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: false,
    unique: false,
  })
  public longitude: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
