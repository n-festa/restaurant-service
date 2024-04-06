import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItemAttribute } from './menu-item-attribute.entity';
import { Unit } from './unit.entity';
import { TasteValue } from './taste-value.entity';

@Entity('Menu_Item_Attribute_Value')
export class MenuItemAttributeValue {
  @PrimaryGeneratedColumn()
  public value_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public attribute_id: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public value: number;

  @Column({ type: 'int', nullable: true, unique: false })
  public unit: number;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public taste_value: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public note: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public price_variance: number;

  @Column({ type: 'tinyint', nullable: true, unique: false })
  public is_standard: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP

  @ManyToOne(
    () => MenuItemAttribute,
    (menuItemAttribute) => menuItemAttribute.values,
  )
  @JoinColumn({
    name: 'attribute_id',
    referencedColumnName: 'attribute_id',
  })
  public attribute_obj: MenuItemAttribute;

  @ManyToOne(() => Unit)
  @JoinColumn({
    name: 'unit',
    referencedColumnName: 'unit_id',
  })
  public unit_obj: Unit;

  @ManyToOne(() => TasteValue)
  @JoinColumn({
    name: 'taste_value',
    referencedColumnName: 'value_id',
  })
  public taste_value_obj: TasteValue;
}
