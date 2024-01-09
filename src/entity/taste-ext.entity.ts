import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItemAttribute } from './menu-item-attribute.entity';

@Entity('Taste_Ext')
export class TasteExt {
  @PrimaryColumn()
  public taste_id: string;

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
  @ManyToOne(() => MenuItemAttribute, (attribute) => attribute.taste_ext)
  @JoinColumn({
    name: 'taste_id',
    referencedColumnName: 'taste_id',
  })
  public taste: MenuItemAttribute;
}
