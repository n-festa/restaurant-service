import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BasicCustomization } from './basic-customization.entity';

@Entity('No_Adding_Ext')
export class NoAddingExt {
  @PrimaryColumn()
  public no_adding_id: string;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public description: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP
  @ManyToOne((type) => BasicCustomization, (basic) => basic.extension)
  @JoinColumn({
    name: 'no_adding_id',
    referencedColumnName: 'no_adding_id',
  })
  public basic: BasicCustomization;
}
