import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Packaging } from './packaging.entity';

@Entity('Packaging_Ext')
export class PackagingExt {
  @PrimaryColumn()
  public packaging_id: number;
  @PrimaryColumn()
  public ISO_language_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public description: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(() => Packaging, (packaging) => packaging.packaging_ext_obj)
  @JoinColumn({
    name: 'packaging_id',
    referencedColumnName: 'packaging_id',
  })
  public packaging_obj: Packaging;
}
