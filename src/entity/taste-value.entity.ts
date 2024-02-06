import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { TasteValueExt } from './taste-value-ext.entity';

@Entity('Taste_Value')
export class TasteValue {
  @PrimaryColumn()
  public value_id: string;

  @Column({ type: 'int', unique: false, nullable: true })
  public order: number;

  @Column({ type: 'tinyint', unique: false, nullable: true })
  public is_default_taste: boolean;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @OneToMany(() => TasteValueExt, (ext) => ext.taste_value_obj)
  public taste_value_ext: TasteValueExt[];
}
