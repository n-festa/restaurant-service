import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('Unit_Ext')
export class UnitExt {
  @PrimaryColumn()
  public unit_id: number;

  @PrimaryColumn()
  public ISO_language_code: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public description: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //relationship
  @ManyToOne(() => Unit, (unit) => unit.unit_ext)
  @JoinColumn({
    name: 'unit_id',
    referencedColumnName: 'unit_id',
  })
  unit: Unit;
}
