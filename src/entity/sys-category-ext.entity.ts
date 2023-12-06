import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SysCategory } from './sys-category.entity';

@Entity('Sys_Category_Ext')
export class SysCategoryExt {
  @PrimaryColumn()
  public sys_category_id: number;

  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
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

  @ManyToOne(() => SysCategory, (category) => category.extension)
  @JoinColumn({
    name: 'sys_category_id',
    referencedColumnName: 'sys_category_id',
  })
  sys_category_obj: SysCategory;
}
