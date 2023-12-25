import {
  Entity,
  CreateDateColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { MenuItem } from './menu-item.entity';
import { Unit } from './unit.entity';

@Entity('Recipe')
export class Recipe {
  @PrimaryColumn()
  public ingredient_id: number;

  @PrimaryColumn()
  public menu_item_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public quantity: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public unit: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIPS
  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipe, {
    eager: true,
  })
  @JoinColumn({
    name: 'ingredient_id',
    referencedColumnName: 'ingredient_id',
  })
  public ingredient: Ingredient;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.recipe)
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  public menu_item: MenuItem;

  @ManyToOne(() => Unit)
  @JoinColumn({
    name: 'unit',
    referencedColumnName: 'unit_id',
  })
  public unit_obj: Unit;
}
