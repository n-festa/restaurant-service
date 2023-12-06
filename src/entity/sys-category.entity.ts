import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SysCategoryExt } from './sys-category-ext.entity';
import { Media } from './media.entity';

@Entity('Sys_Category')
export class SysCategory {
  @PrimaryGeneratedColumn()
  public sys_category_id: number;

  @Column({ type: 'varchar', length: 45, nullable: false, unique: false })
  public type: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    unique: false,
    default: 0,
  })
  public is_active: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public image: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @OneToMany(() => SysCategoryExt, (ext) => ext.sys_category_obj, {
    eager: true,
  })
  public extension: SysCategoryExt[];

  @ManyToOne(() => Media, { eager: true })
  @JoinColumn({ name: 'image', referencedColumnName: 'media_id' })
  public image_obj: Media;
}
