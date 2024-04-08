import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('Menu_Item_Attribute_Ingredient')
export class MenuItemAttributeIngredient {
  @PrimaryColumn()
  public attribute_id: number;

  @PrimaryColumn()
  public ingredient_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
