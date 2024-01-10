import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SKU } from './sku.entity';
import { MenuItemAttribute } from './menu-item-attribute.entity';
import { MenuItemAttributeValue } from './menu-item-attribute-value.entity';

@Entity('SKU_Detail')
export class SkuDetail {
  @PrimaryColumn()
  public sku_id: number;

  @PrimaryColumn()
  public attribute_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public value_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS

  @ManyToOne(() => SKU, (sku) => sku.detail)
  @JoinColumn({
    name: 'sku_id',
    referencedColumnName: 'sku_id',
  })
  public sku_obj: SKU;

  @ManyToOne(() => MenuItemAttribute)
  @JoinColumn({
    name: 'attribute_id',
    referencedColumnName: 'attribute_id',
  })
  public attribute_obj: MenuItemAttribute;

  @ManyToOne(() => MenuItemAttributeValue)
  @JoinColumn({
    name: 'value_id',
    referencedColumnName: 'value_id',
  })
  public value_obj: MenuItemAttributeValue;
}
