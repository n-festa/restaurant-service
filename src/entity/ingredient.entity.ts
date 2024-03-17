import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('Ingredient')
export class Ingredient {
  @PrimaryGeneratedColumn()
  public ingredient_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: false })
  public vie_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public eng_name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public calorie_kcal: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public protein_g: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public fat_g: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
  })
  public carbohydrate_g: string;

  @Column({ type: 'varchar', length: 10, nullable: true, unique: false })
  public ma_BTP2007: string;

  @Column({ type: 'int', nullable: true, unique: false })
  public food_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public img_object_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: false })
  public source: string;

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
  @OneToMany(() => Recipe, (recipe) => recipe.ingredient)
  public recipe: Recipe[];
}
