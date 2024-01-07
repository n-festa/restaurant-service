import { Entity, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('Main_Side_Dish')
export class MainSideDish {
  @PrimaryColumn()
  public main_dish_id: number;

  @PrimaryColumn()
  public side_dish_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
