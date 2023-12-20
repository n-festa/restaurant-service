import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { PackagingExt } from './packaging-ext.entity';

@Entity('Packaging')
export class Packaging {
  @PrimaryGeneratedColumn()
  public packaging_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public price: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public currency: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.packaging_obj)
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  public menu_item_obj: MenuItem;

  @OneToMany(() => PackagingExt, (packagingExt) => packagingExt.packaging_obj)
  public packaging_ext_obj: PackagingExt[];
}
