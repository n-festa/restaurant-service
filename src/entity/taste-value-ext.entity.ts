import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TasteValue } from './taste-value.entity';

@Entity('Taste_Value_Ext')
export class TasteValueExt {
  @PrimaryColumn()
  public value_id: string;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public name: string;

  @Column({ type: 'text', nullable: true, unique: false })
  public description: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(() => TasteValue, (attValue) => attValue.taste_value_ext)
  @JoinColumn({
    name: 'value_id',
    referencedColumnName: 'value_id',
  })
  public taste_value_obj: TasteValue;
}
