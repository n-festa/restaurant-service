import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('Sys_Category_Menu_Item')
export class SysCategoryMenuItem {
  @PrimaryColumn()
  public sys_category_id: number;

  @PrimaryColumn()
  public menu_item_id: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;
}
