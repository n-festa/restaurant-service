import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { UnitExt } from './unit-ext.entity';

@Entity('Unit')
export class Unit {
  @PrimaryGeneratedColumn()
  public unit_id: number;

  @Column({ type: 'varchar', length: 45, nullable: false, unique: false })
  public type: string;

  @Column({ type: 'varchar', length: 32, nullable: false, unique: false })
  public symbol: string;

  @Column({ type: 'varchar', length: 2, nullable: false, unique: false })
  public decimal_place: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //Relationship
  @OneToMany(() => UnitExt, (unitExt) => unitExt.unit, { eager: true })
  unit_ext: UnitExt[];
}
