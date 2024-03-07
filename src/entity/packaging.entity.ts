import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { PackagingExt } from './packaging-ext.entity';
import { Media } from './media.entity';

@Entity('Packaging')
export class Packaging {
  @PrimaryGeneratedColumn()
  public packaging_id: number;

  // @Column({ type: 'int', nullable: false, unique: false })
  // public menu_item_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public restaurant_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public price: number;

  // @Column({ type: 'int', nullable: false, unique: false })
  // public currency: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @OneToMany(() => PackagingExt, (packagingExt) => packagingExt.packaging_obj)
  public packaging_ext_obj: PackagingExt[];

  @OneToMany(() => Media, (media) => media.packaging_obj)
  public media_obj: Media[];
}
